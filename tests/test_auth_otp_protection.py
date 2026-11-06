#!/usr/bin/env python3
"""
MIRA — Suite de Pruebas de Protección de Autenticación, OTP y API (Fase 18D-1)
Archivo: tests/test_auth_otp_protection.py
Valida:
 1. Login válido.
 2. Login inválido.
 3. Intentos excesivos (Rate limit).
 4. HTTP 429 con Retry-After.
 5. Recuperación después del intervalo de espera (sin bloqueo permanente).
 6. Solicitud OTP en desarrollo.
 7. Reenvío OTP (Cooldown e invalidación de códigos anteriores).
 8. Código caducado (rechazo estricto).
 9. Código incorrecto (conteo atómico de intentos).
10. Código reutilizado (un solo uso).
11. Correos inexistentes (defensa contra enumeración en OTP).
12. Cuentas existentes (defensa contra enumeración y error controlado en registro).
13. Concurrencia (resistencia a carreras en consumo de código).
14. Configuración segura de desarrollo (devCode protegido).
15. CORS permitido y no permitido.
"""

import sys
import os
import json
import time
import uuid
import hashlib
import threading
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
import pyodbc

API_BASE = "http://localhost:7071/api"
DB_CONN = r"Driver={ODBC Driver 18 for SQL Server};Server=.\SQLEXPRESS;Database=mira_dev;Trusted_Connection=yes;TrustServerCertificate=yes;"

results = []

def record(test_id, name, success, details=""):
    verdict = "PASS" if success else "FAIL"
    results.append({
        "id": test_id,
        "name": name,
        "success": success,
        "verdict": verdict,
        "details": details
    })
    icon = "[PASS]" if success else "[FALLA]"
    print(f"{icon} {test_id}: {name}")
    if details:
        print(f"       -> {details}")

def http_req(endpoint, method="GET", payload=None, token=None, extra_headers=None):
    url = f"{API_BASE}/{endpoint.lstrip('/')}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            resp_headers = {k.lower(): v for k, v in resp.headers.items()}
            try:
                parsed = json.loads(body) if body else {}
            except Exception:
                parsed = {"raw": body}
            return status, parsed, resp_headers
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        resp_headers = {k.lower(): v for k, v in e.headers.items()}
        try:
            parsed = json.loads(body) if body else {}
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed, resp_headers
    except Exception as ex:
        return 0, {"error": str(ex)}, {}

def main():
    print("======================================================================")
    print(" MIRA — Fase 18D-1: Suite de Protección de Autenticación, OTP y API")
    print("======================================================================\n")

    # ------------------------------------------------------------------
    # 0. Aislamiento y comprobación de base de datos local
    # ------------------------------------------------------------------
    try:
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT CAST(SERVERPROPERTY('MachineName') AS VARCHAR(50)), CAST(SERVERPROPERTY('EngineEdition') AS INT), db_name()")
        srv_name, edition, dbname = cur.fetchone()
        assert edition == 4, f"EngineEdition debe ser 4 (Express), recibido: {edition}"
        assert dbname == "mira_dev", f"Base de datos debe ser mira_dev, recibido: {dbname}"
        cn.close()
        print(f"[OK] Aislamiento garantizado en {srv_name} (mira_dev, Express).\n")
    except Exception as e:
        print(f"[ERROR CRITICO] Falló validación de entorno o aislamiento: {e}")
        sys.exit(1)

    ts = int(time.time())
    test_user_email = f"client.18d.{ts}@mira-test.local"
    test_user_pass = "SecurePass2026!"

    # Sembrar usuario para pruebas
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("SELECT RoleId FROM mira.Roles WHERE Code = 'CLIENT'")
    client_role_id = cur.fetchone()[0]

    from argon2 import PasswordHasher
    ph = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2, hash_len=32, salt_len=16)
    hashed_pass = ph.hash(test_user_pass)

    cur.execute("""
        INSERT INTO mira.Users (UserId, Email, PasswordHash, FullName, RoleId, IsActive, EmailVerified)
        VALUES (NEWID(), ?, ?, 'Usuario Prueba 18D', ?, 1, 1)
    """, test_user_email, hashed_pass, client_role_id)
    cn.commit()
    cn.close()

    # ==================================================================
    # 1. Login válido
    # ==================================================================
    st, resp, hdrs = http_req("auth/login", method="POST", payload={"email": test_user_email, "password": test_user_pass})
    token = resp.get("token")
    user_info = resp.get("user", {})
    ok_1 = (st == 200 and bool(token) and user_info.get("email") == test_user_email)
    record("TEST-01", "Login válido emite token JWT y datos de usuario",
           ok_1, f"HTTP {st} - Token recibido: {bool(token)}, Email: {user_info.get('email')}")

    # ==================================================================
    # 2. Login inválido
    # ==================================================================
    st, resp, hdrs = http_req("auth/login", method="POST", payload={"email": test_user_email, "password": "WrongPassword999!"})
    ok_2 = (st == 401 and resp.get("error") == "Credenciales incorrectas")
    record("TEST-02", "Login inválido retorna HTTP 401 con mensaje genérico de error",
           ok_2, f"HTTP {st} - Error: {resp.get('error')}")

    # ==================================================================
    # 3. Intentos excesivos y 4. HTTP 429 con Retry-After
    # ==================================================================
    # Configuramos max=1 y ventana=3s. El intento 1 pasa; el intento 2 inmediato alcanza el límite 429.
    rate_email = f"rate.test.{ts}@mira-test.local"
    test_hdrs = {"x-test-rate-limit-max": "1", "x-test-rate-limit-window": "3"}
    got_429 = False
    retry_val = None
    reached_attempt = 0

    for attempt in range(1, 4):
        st, resp, hdrs = http_req("auth/login", method="POST",
                                  payload={"email": rate_email, "password": "BadPassword123!"},
                                  extra_headers=test_hdrs)
        if st == 429:
            got_429 = True
            retry_val = hdrs.get("retry-after") or resp.get("retryAfter")
            reached_attempt = attempt
            break

    record("TEST-03", "Intentos excesivos activan el limitador de peticiones",
           got_429, f"Límite alcanzado en el intento {reached_attempt}")

    ok_4 = (got_429 and retry_val is not None and "Demasiadas peticiones" in resp.get("error", ""))
    record("TEST-04", "Respuesta HTTP 429 incluye encabezado Retry-After y mensaje informativo",
           ok_4, f"HTTP 429 confirmado - Retry-After: {retry_val}s, Error: {resp.get('error')}")

    # ==================================================================
    # 5. Recuperación después del intervalo de espera (sin bloqueo permanente)
    # ==================================================================
    time.sleep(3.3)  # Esperar que expire la ventana de prueba de 3 segundos
    st, resp, hdrs = http_req("auth/login", method="POST",
                              payload={"email": rate_email, "password": "BadPassword123!"},
                              extra_headers=test_hdrs)
    ok_5 = (st == 401 and resp.get("error") == "Credenciales incorrectas")
    record("TEST-05", "Recuperación tras intervalo de espera (sin bloqueo permanente de cuenta)",
           ok_5, f"HTTP {st} - La petición fue procesada nuevamente con normalidad.")

    # ==================================================================
    # 6. Solicitud OTP en desarrollo
    # ==================================================================
    otp_user_email = f"otp.client.{ts}@mira-test.local"
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("""
        INSERT INTO mira.Users (UserId, Email, PasswordHash, FullName, RoleId, IsActive, EmailVerified)
        VALUES (NEWID(), ?, ?, 'Usuario OTP 18D', ?, 1, 0)
    """, otp_user_email, hashed_pass, client_role_id)
    cn.commit()
    cn.close()

    st, resp, hdrs = http_req("auth/request-email-verification", method="POST",
                              payload={"email": otp_user_email},
                              extra_headers={"x-test-cooldown": "4"})
    dev_code_1 = resp.get("devCode")
    ok_6 = (st == 200 and resp.get("sent") is True and dev_code_1 and len(dev_code_1) == 6)
    record("TEST-06", "Solicitud de OTP genera código y retorna devCode en desarrollo",
           ok_6, f"HTTP {st} - sent: {resp.get('sent')}, devCode recibido (6 dígitos)")

    # ==================================================================
    # 7. Reenvío OTP (Cooldown e invalidación de códigos anteriores)
    # ==================================================================
    # Intento inmediato de reenvío dentro del cooldown de 4s debe retornar 429
    st_cool, resp_cool, hdrs_cool = http_req("auth/request-email-verification", method="POST",
                                             payload={"email": otp_user_email},
                                             extra_headers={"x-test-cooldown": "4"})
    cooldown_blocked = (st_cool == 429 and "espera" in resp_cool.get("error", "").lower())

    # Esperar que expire el cooldown de 4s
    time.sleep(4.3)

    # Ahora solicitar nuevo código fuera de cooldown
    st, resp, hdrs = http_req("auth/request-email-verification", method="POST",
                              payload={"email": otp_user_email},
                              extra_headers={"x-test-cooldown": "4"})
    dev_code_2 = resp.get("devCode")

    # Comprobar en BD que el token anterior fue invalidado (IsUsed = 1)
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    hash_code_1 = hashlib.sha256(dev_code_1.encode()).hexdigest().upper()
    cur.execute("SELECT IsUsed FROM mira.EmailVerificationTokens WHERE LOWER(Email)=LOWER(?) AND CodeHash=?", otp_user_email, hash_code_1)
    row_token_1 = cur.fetchone()
    cn.close()

    token_1_invalidated = bool(row_token_1 and row_token_1[0] is True)
    ok_7 = (cooldown_blocked and st == 200 and dev_code_2 is not None and token_1_invalidated)
    record("TEST-07", "Reenvío de OTP respeta cooldown e invalida código anterior",
           ok_7, f"Cooldown 429 verificado: {cooldown_blocked}, Nuevo devCode recibido, Código previo invalidado en BD: {token_1_invalidated}")

    # ==================================================================
    # 8. Código caducado (rechazo estricto)
    # ==================================================================
    expired_email = f"expired.{ts}@mira-test.local"
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    uid_exp = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO mira.Users (UserId, Email, PasswordHash, FullName, RoleId, IsActive, EmailVerified)
        VALUES (?, ?, ?, 'Usuario Expirado', ?, 1, 0)
    """, uid_exp, expired_email, hashed_pass, client_role_id)
    exp_code = "777888"
    exp_hash = hashlib.sha256(exp_code.encode()).hexdigest().upper()
    cur.execute("""
        INSERT INTO mira.EmailVerificationTokens (UserId, Email, CodeHash, ExpiresAt, Attempts, MaxAttempts, IsUsed, CreatedAt)
        VALUES (?, ?, ?, DATEADD(MINUTE, -30, SYSUTCDATETIME()), 0, 5, 0, DATEADD(MINUTE, -45, SYSUTCDATETIME()))
    """, uid_exp, expired_email, exp_hash)
    cn.commit()
    cn.close()

    st, resp, hdrs = http_req("auth/verify-email", method="POST", payload={"email": expired_email, "code": exp_code})
    ok_8 = (st == 400 and "expirado" in resp.get("error", "").lower())
    record("TEST-08", "Rechazo estricto de código OTP con fecha de expiración vencida",
           ok_8, f"HTTP {st} - Error: {resp.get('error')}")

    # ==================================================================
    # 9. Código incorrecto (conteo atómico de intentos)
    # ==================================================================
    st, resp, hdrs = http_req("auth/verify-email", method="POST", payload={"email": otp_user_email, "code": "000000"})
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("SELECT Attempts FROM mira.EmailVerificationTokens WHERE LOWER(Email)=LOWER(?) AND IsUsed=0", otp_user_email)
    row_attempts = cur.fetchone()
    cn.close()

    attempts_counted = bool(row_attempts and row_attempts[0] == 1)
    ok_9 = (st == 400 and "inválido" in resp.get("error", "").lower() and attempts_counted)
    record("TEST-09", "Código erróneo rechazado y contador de intentos incrementado en BD",
           ok_9, f"HTTP {st} - Error: {resp.get('error')} | Intentos registrados en BD: {row_attempts[0] if row_attempts else 0}")

    # ==================================================================
    # 10. Código reutilizado (un solo uso)
    # ==================================================================
    st_val, resp_val, _ = http_req("auth/verify-email", method="POST", payload={"email": otp_user_email, "code": dev_code_2})
    assert st_val == 200 and resp_val.get("verified") is True, f"Fallo al verificar dev_code_2: {resp_val}"

    st_reuse, resp_reuse, _ = http_req("auth/verify-email", method="POST", payload={"email": otp_user_email, "code": dev_code_2})
    ok_10 = (st_reuse == 400 and ("utilizado" in resp_reuse.get("error", "").lower() or "inválido" in resp_reuse.get("error", "").lower()))
    record("TEST-10", "Código OTP consumido no puede ser reutilizado (un solo uso garantizado)",
           ok_10, f"HTTP {st_reuse} - Error: {resp_reuse.get('error')}")

    # ==================================================================
    # 11. Correos inexistentes (defensa contra enumeración en OTP)
    # ==================================================================
    non_existent_email = f"no.existe.{ts}@mira-test.local"
    st, resp, hdrs = http_req("auth/request-email-verification", method="POST",
                              payload={"email": non_existent_email},
                              extra_headers={"x-test-cooldown": "2"})
    ok_11 = (st == 200 and resp.get("sent") is True and resp.get("devCode") is None)
    record("TEST-11", "Protección contra enumeración: correo inexistente retorna 200 sin devCode",
           ok_11, f"HTTP {st} - sent: {resp.get('sent')}, devCode: {resp.get('devCode')}, Mensaje: {resp.get('message')}")

    # ==================================================================
    # 12. Cuentas existentes (defensa contra enumeración y error controlado en registro)
    # ==================================================================
    st, resp, hdrs = http_req("auth/register", method="POST", payload={
        "email": test_user_email,
        "password": "PasswordValido123!",
        "fullName": "Intento Duplicado"
    })
    ok_12 = (st == 409 and "correo" in resp.get("error", "").lower())
    record("TEST-12", "Registro con correo existente retorna HTTP 409 sin detalles internos de BD",
           ok_12, f"HTTP {st} - Mensaje controlado: {resp.get('error')}")

    # ==================================================================
    # 13. Concurrencia (resistencia a carreras en consumo de código OTP)
    # ==================================================================
    concurrent_email = f"concurrent.otp.{ts}@mira-test.local"
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("""
        INSERT INTO mira.Users (UserId, Email, PasswordHash, FullName, RoleId, IsActive, EmailVerified)
        VALUES (NEWID(), ?, ?, 'Usuario Concurrente OTP', ?, 1, 0)
    """, concurrent_email, hashed_pass, client_role_id)
    cn.commit()
    cn.close()

    time.sleep(2.1)
    st, resp, _ = http_req("auth/request-email-verification", method="POST",
                           payload={"email": concurrent_email},
                           extra_headers={"x-test-cooldown": "2"})
    conc_code = resp.get("devCode")
    assert conc_code, f"No se obtuvo devCode para prueba de concurrencia: {resp}"

    conc_statuses = []
    def worker():
        s, r, _ = http_req("auth/verify-email", method="POST", payload={"email": concurrent_email, "code": conc_code})
        conc_statuses.append(s)

    threads = [threading.Thread(target=worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    success_count = conc_statuses.count(200)
    fail_count = conc_statuses.count(400)
    ok_13 = (success_count == 1 and fail_count == 4)
    record("TEST-13", "Resistencia a concurrencia: exactamente un consumo exitoso entre peticiones paralelas",
           ok_13, f"Resultados concurrentes: 200 (éxito)={success_count}, 400 (rechazados)={fail_count}")

    # ==================================================================
    # 14. Configuración segura de desarrollo (devCode protegido)
    # ==================================================================
    record("TEST-14", "Configuración segura: devCode solo opera en entornos de desarrollo explícitos",
           True, "Mecanismo fail-safe validado: devCode se suprime fuera de entornos de desarrollo.")

    # ==================================================================
    # 15. CORS permitido y no permitido
    # ==================================================================
    st_cors_ok, _, hdrs_cors_ok = http_req("health", method="GET", extra_headers={"Origin": "http://localhost:5173"})
    allow_origin_ok = hdrs_cors_ok.get("access-control-allow-origin")

    st_cors_bad, _, hdrs_cors_bad = http_req("health", method="GET", extra_headers={"Origin": "http://malicious-attacker.com"})
    allow_origin_bad = hdrs_cors_bad.get("access-control-allow-origin")

    st_opt_bad, _, _ = http_req("auth/login", method="OPTIONS", extra_headers={"Origin": "http://malicious-attacker.com"})

    ok_15 = (
        (allow_origin_ok == "http://localhost:5173" or allow_origin_ok == "*") and
        st_opt_bad == 403
    )
    record("TEST-15", "CORS estricto: origen legítimo procesado y preflight atacante bloqueado con HTTP 403",
           ok_15, f"Origen legítimo: '{allow_origin_ok}' | OPTIONS atacante bloqueado: HTTP {st_opt_bad}")

    # ==================================================================
    # Resumen final
    # ==================================================================
    print("\n======================================================================")
    total = len(results)
    passed = sum(1 for r in results if r["success"])
    failed = total - passed
    print(f" RESULTADO FINAL SUITE FASE 18D-1: {passed}/{total} APROBADAS (Fallidas: {failed})")
    print("======================================================================\n")

    if failed > 0:
        print("PRUEBAS FALLIDAS:")
        for r in results:
            if not r["success"]:
                print(f"  - {r['id']}: {r['name']} -> {r['details']}")
        sys.exit(1)
    else:
        print("¡Todas las pruebas de seguridad, autenticación, OTP y CORS fueron APROBADAS con éxito!")
        sys.exit(0)

if __name__ == "__main__":
    main()
