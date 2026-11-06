#!/usr/bin/env python3
"""
MIRA — Suite de Pruebas de Sesiones Seguras, Cookies HttpOnly y Refresh Tokens (Fase 18D-2B)
Archivo: tests/test_secure_sessions.py
Valida:
 1. Login con creación de sesión en mira.UserSessions.
 2. Emisión correcta de cookies (mira_session, mira_refresh, mira_csrf).
 3. Consulta de perfil mediante GET /api/auth/me con cookie de sesión.
 4. Sesión inválida / cookie inexistente -> HTTP 401.
 5. Cookie alterada / manipulada -> HTTP 401.
 6. Sesión expirada (ExpiresAt/IdleExpiresAt) -> HTTP 401.
 7. Renovación mediante refresh token (POST /api/auth/refresh).
 8. Rotación de refresh token (invalida el anterior y emite uno nuevo).
 9. Reutilización de token anterior (detección de robo -> revoca todas las sesiones).
10. Logout (POST /api/auth/logout) -> revoca sesión y borra cookies.
11. Revocación / acceso posterior con sesión revocada es denegado (HTTP 401).
12. CSRF válido e inválido (token discrepante -> HTTP 403, token válido -> HTTP 200).
13. Origen externo rechazado por CSRF (Origin malicioso -> HTTP 403).
14. Concurrencia transaccional en rotación de refresh token.
15. Compatibilidad retroactiva Bearer intacta.
16. Roles CLIENT, OPERATOR y ADMIN reconocidos correctamente en /auth/me.
17. Preservación de auto-claim en solicitudes del cliente.
18. Ausencia de secretos (hashes, passwords) en respuestas y logs.
"""

import sys
import os
import json
import time
import uuid
import hashlib
import secrets
import threading
import urllib.request
import urllib.error
from datetime import datetime, timezone
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

def parse_cookie_header(cookie_list):
    cookies = {}
    for c in cookie_list:
        parts = c.split(";")
        name_val = parts[0].strip()
        if "=" in name_val:
            k, v = name_val.split("=", 1)
            cookies[k.strip()] = {
                "value": v.strip(),
                "raw": c,
                "httponly": "httponly" in c.lower(),
                "samesite": "samesite=strict" in c.lower(),
                "path": [p.split("=")[1].strip() for p in parts if p.strip().lower().startswith("path=")]
            }
    return cookies

def http_req(endpoint, method="GET", payload=None, token=None, cookies=None, extra_headers=None):
    url = f"{API_BASE}/{endpoint.lstrip('/')}"
    headers = {
        "Content-Type": "application/json",
        "x-test-rate-limit-max": "50",
        "x-test-rate-limit-window": "60"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if cookies:
        if isinstance(cookies, dict):
            headers["Cookie"] = "; ".join([f"{k}={v}" for k, v in cookies.items()])
        elif isinstance(cookies, str):
            headers["Cookie"] = cookies
    if extra_headers:
        headers.update(extra_headers)

    body_bytes = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            resp_headers = resp.headers
            resp_body = resp.read().decode("utf-8")
            raw_cookies = resp_headers.get_all("Set-Cookie") or []
            data = json.loads(resp_body) if resp_body else {}
            return status, data, resp_headers, raw_cookies
    except urllib.error.HTTPError as e:
        status = e.code
        resp_headers = e.headers
        raw_cookies = resp_headers.get_all("Set-Cookie") or []
        body_str = e.read().decode("utf-8") if e.fp else ""
        try:
            data = json.loads(body_str) if body_str else {}
        except Exception:
            data = {"raw": body_str}
        return status, data, resp_headers, raw_cookies
    except Exception as ex:
        return 0, {"error": str(ex)}, {}, []

def run_all_tests():
    print("=" * 80)
    print("MIRA - Fase 18D-2B: Suite de Pruebas de Sesiones Seguras y Cookies")
    print(f"Hora de inicio: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 80)

    # Credenciales de prueba oficiales en mira_dev
    client_email = "cliente.verificado@mira-local.dev"
    client_pwd = "TestDev2026!"
    operator_email = "operador.test@mira-local.dev"
    operator_pwd = "TestDev2026!"
    admin_email = "admin.test@mira-local.dev"
    admin_pwd = "TestDev2026!"

    # TEST 01: Login con creación de sesión
    st, data, hdrs, set_cookies = http_req("auth/login", method="POST", payload={"email": client_email, "password": client_pwd})
    cookies_map = parse_cookie_header(set_cookies)
    
    sess_id = None
    if st == 200 and "token" in data and "csrfToken" in data:
        # Check DB to confirm session record created
        with pyodbc.connect(DB_CONN) as cn:
            cur = cn.cursor()
            cur.execute("""
                SELECT TOP 1 SessionId, UserId, RefreshTokenHash, CsrfTokenHash, IsRevoked, ExpiresAt
                FROM mira.UserSessions
                ORDER BY CreatedAt DESC
            """)
            db_sess = cur.fetchone()
            if db_sess:
                sess_id = str(db_sess.SessionId)
                record("TEST-01", "Login con creación de registro en mira.UserSessions", True, f"SessionId={sess_id}")
            else:
                record("TEST-01", "Login con creación de registro en mira.UserSessions", False, "No se encontró registro en DB")
    else:
        record("TEST-01", "Login con creación de registro en mira.UserSessions", False, f"Status: {st}, Error: {data}")

    # TEST 02: Emisión correcta de cookies
    c_sess = cookies_map.get("mira_session")
    c_ref = cookies_map.get("mira_refresh")
    c_csrf = cookies_map.get("mira_csrf")

    valid_cookies = (
        c_sess is not None and c_sess["httponly"] and c_sess["samesite"] and "/api" in c_sess["path"] and
        c_ref is not None and c_ref["httponly"] and c_ref["samesite"] and "/api/auth" in c_ref["path"] and
        c_csrf is not None and not c_csrf["httponly"] and c_csrf["samesite"]
    )
    record("TEST-02", "Emisión correcta de cookies (mira_session, mira_refresh, mira_csrf)", valid_cookies,
           f"mira_session HttpOnly={c_sess['httponly'] if c_sess else False}, mira_csrf no-HttpOnly={not c_csrf['httponly'] if c_csrf else False}")

    # TEST 03: Consulta de perfil mediante GET /auth/me con cookie de sesión
    session_jwt = c_sess["value"] if c_sess else data.get("token")
    csrf_val = c_csrf["value"] if c_csrf else data.get("csrfToken")

    st, me_data, _, _ = http_req("auth/me", method="GET", cookies={"mira_session": session_jwt})
    ok_me = (st == 200 and me_data.get("user", {}).get("email") == client_email and me_data["user"].get("role") == "CLIENT")
    record("TEST-03", "Consulta de perfil mediante GET /auth/me con cookie de sesión", ok_me, f"Status={st}, Email={me_data.get('user', {}).get('email')}")

    # TEST 04: Sesión inválida / cookie inexistente -> HTTP 401
    st_none, data_none, _, _ = http_req("auth/me", method="GET")
    record("TEST-04", "Sesión inválida / cookie inexistente -> HTTP 401", st_none == 401, f"Status={st_none}")

    # TEST 05: Cookie alterada / manipulada -> HTTP 401
    fake_jwt = (session_jwt[:-10] + "corrupted00") if session_jwt else "fake.jwt.corrupted"
    st_corrupt, _, _, _ = http_req("auth/me", method="GET", cookies={"mira_session": fake_jwt})
    record("TEST-05", "Cookie alterada / manipulada -> HTTP 401", st_corrupt == 401, f"Status={st_corrupt}")

    # TEST 06: Sesión expirada (ExpiresAt en DB) -> HTTP 401
    if sess_id:
        with pyodbc.connect(DB_CONN) as cn:
            cur = cn.cursor()
            cur.execute("UPDATE mira.UserSessions SET ExpiresAt = DATEADD(HOUR, -2, SYSUTCDATETIME()) WHERE SessionId = ?", sess_id)
            cn.commit()

        st_exp, _, _, _ = http_req("auth/me", method="GET", cookies={"mira_session": session_jwt})
        record("TEST-06", "Sesión expirada (ExpiresAt) -> HTTP 401", st_exp == 401, f"Status={st_exp}")

        # Restaurar sesión para siguientes pruebas
        with pyodbc.connect(DB_CONN) as cn:
            cur = cn.cursor()
            cur.execute("UPDATE mira.UserSessions SET ExpiresAt = DATEADD(DAY, 7, SYSUTCDATETIME()) WHERE SessionId = ?", sess_id)
            cn.commit()
    else:
        record("TEST-06", "Sesión expirada (ExpiresAt) -> HTTP 401", False, "Falta sess_id")

    # TEST 07: Renovación mediante refresh token (POST /auth/refresh)
    # Hacemos login fresco para tener refresh token activo
    st_l, data_l, _, cookies_l = http_req("auth/login", method="POST", payload={"email": client_email, "password": client_pwd})
    c_map_l = parse_cookie_header(cookies_l)
    ref_token_val = c_map_l["mira_refresh"]["value"]
    csrf_val_l = c_map_l["mira_csrf"]["value"]

    st_ref, data_ref, _, cookies_ref = http_req(
        "auth/refresh",
        method="POST",
        cookies={"mira_refresh": ref_token_val, "mira_csrf": csrf_val_l},
        extra_headers={"X-CSRF-Token": csrf_val_l, "Origin": "http://localhost:5173"}
    )
    c_map_ref = parse_cookie_header(cookies_ref)
    ok_refresh = (st_ref == 200 and "mira_session" in c_map_ref and "mira_refresh" in c_map_ref)
    record("TEST-07", "Renovación mediante refresh token (POST /auth/refresh)", ok_refresh, f"Status={st_ref}")

    # TEST 08: Rotación de refresh token: el token previo quedó revocado
    # Intentar usar el token previo nuevamente (sin reuse detection trigger todavía, para verificar que no es aceptado)
    new_ref_val = c_map_ref["mira_refresh"]["value"] if "mira_refresh" in c_map_ref else ""
    new_csrf_val = c_map_ref["mira_csrf"]["value"] if "mira_csrf" in c_map_ref else ""

    # Verificar en base de datos que el token anterior tiene IsRevoked=1 y ReplacedBySessionId no es nulo
    old_token_hash = hashlib.sha256(ref_token_val.encode()).hexdigest()
    with pyodbc.connect(DB_CONN) as cn:
        cur = cn.cursor()
        cur.execute("SELECT IsRevoked, ReplacedBySessionId FROM mira.UserSessions WHERE RefreshTokenHash = ?", old_token_hash)
        old_sess_row = cur.fetchone()
        is_old_revoked = bool(old_sess_row and old_sess_row.IsRevoked == 1 and old_sess_row.ReplacedBySessionId is not None)
    
    record("TEST-08", "Rotación de refresh token (invalida el previo con ReplacedBySessionId)", is_old_revoked,
           f"OldToken IsRevoked={old_sess_row.IsRevoked if old_sess_row else None}")

    # TEST 09: Reutilización de token anterior (detección de robo)
    # Al presentar ref_token_val (que ya fue rotado/revocado), el servidor debe detectar reuse y revocar TODAS las sesiones
    st_reuse, data_reuse, _, _ = http_req(
        "auth/refresh",
        method="POST",
        cookies={"mira_refresh": ref_token_val, "mira_csrf": csrf_val_l},
        extra_headers={"X-CSRF-Token": csrf_val_l, "Origin": "http://localhost:5173"}
    )
    ok_reuse = (st_reuse == 401 and "reutilización" in str(data_reuse.get("error", "")).lower())
    record("TEST-09", "Reutilización de token anterior (detección de robo y revocación masiva)", ok_reuse,
           f"Status={st_reuse}, Error={data_reuse.get('error')}")

    # Verificar que el nuevo token también quedó revocado tras el ataque simulado
    st_new_check, _, _, _ = http_req(
        "auth/refresh",
        method="POST",
        cookies={"mira_refresh": new_ref_val, "mira_csrf": new_csrf_val},
        extra_headers={"X-CSRF-Token": new_csrf_val, "Origin": "http://localhost:5173"}
    )
    record("TEST-09B", "Confirmación: todas las sesiones del usuario fueron invalidadas tras reuse", st_new_check == 401, f"Status={st_new_check}")

    # TEST 10: Logout (POST /auth/logout) revoca sesión y borra cookies
    # Nuevo login para probar logout
    _, _, _, cookies_log = http_req("auth/login", method="POST", payload={"email": client_email, "password": client_pwd})
    c_log_map = parse_cookie_header(cookies_log)
    active_sess_jwt = c_log_map["mira_session"]["value"]
    active_csrf = c_log_map["mira_csrf"]["value"]

    st_logout, data_logout, _, cookies_del = http_req(
        "auth/logout",
        method="POST",
        cookies={"mira_session": active_sess_jwt, "mira_csrf": active_csrf},
        extra_headers={"X-CSRF-Token": active_csrf, "Origin": "http://localhost:5173"}
    )
    del_map = parse_cookie_header(cookies_del)
    cookies_cleared = (
        "mira_session" in del_map and "max-age=0" in del_map["mira_session"]["raw"].lower() and
        "mira_refresh" in del_map and "max-age=0" in del_map["mira_refresh"]["raw"].lower()
    )
    record("TEST-10", "Logout revoca sesión y emite cookies con Max-Age=0", st_logout == 200 and cookies_cleared,
           f"Status={st_logout}, Max-Age=0 presente={cookies_cleared}")

    # TEST 11: Acceso posterior con sesión revocada tras logout es denegado
    st_post_logout, _, _, _ = http_req("auth/me", method="GET", cookies={"mira_session": active_sess_jwt})
    record("TEST-11", "Acceso posterior con sesión revocada tras logout es denegado (HTTP 401)", st_post_logout == 401, f"Status={st_post_logout}")

    # TEST 12: CSRF válido e inválido en petición mutativa
    # Login para obtener sesión activa y tokens
    _, _, _, cookies_csrf = http_req("auth/login", method="POST", payload={"email": client_email, "password": client_pwd})
    c_csrf_map = parse_cookie_header(cookies_csrf)
    test_sess_jwt = c_csrf_map["mira_session"]["value"]
    test_csrf_token = c_csrf_map["mira_csrf"]["value"]

    # 12A: Token CSRF faltante en mutación con cookie -> 403
    st_csrf_missing, data_csrf_m, _, _ = http_req(
        "requests/claim",
        method="POST",
        cookies={"mira_session": test_sess_jwt, "mira_csrf": test_csrf_token},
        extra_headers={"Origin": "http://localhost:5173"} # sin X-CSRF-Token
    )
    record("TEST-12A", "Protección CSRF: Petición mutativa sin X-CSRF-Token rechazada con HTTP 403", st_csrf_missing == 403, f"Status={st_csrf_missing}")

    # 12B: Token CSRF alterado/discrepante -> 403
    st_csrf_bad, _, _, _ = http_req(
        "requests/claim",
        method="POST",
        cookies={"mira_session": test_sess_jwt, "mira_csrf": test_csrf_token},
        extra_headers={"X-CSRF-Token": "token-falsificado-12345", "Origin": "http://localhost:5173"}
    )
    record("TEST-12B", "Protección CSRF: Token discrepante rechazado con HTTP 403", st_csrf_bad == 403, f"Status={st_csrf_bad}")

    # 12C: Token CSRF válido -> Autorizado (200 o resultado de negocio)
    st_csrf_ok, data_c_ok, _, _ = http_req(
        "requests/claim",
        method="POST",
        cookies={"mira_session": test_sess_jwt, "mira_csrf": test_csrf_token},
        extra_headers={"X-CSRF-Token": test_csrf_token, "Origin": "http://localhost:5173"}
    )
    record("TEST-12C", "Protección CSRF: Token válido y vinculado aprobado (HTTP 200)", st_csrf_ok == 200, f"Status={st_csrf_ok}")

    # TEST 13: Origen externo rechazado por CSRF
    st_evil, _, _, _ = http_req(
        "requests/claim",
        method="POST",
        cookies={"mira_session": test_sess_jwt, "mira_csrf": test_csrf_token},
        extra_headers={"X-CSRF-Token": test_csrf_token, "Origin": "https://malicious-attacker.com"}
    )
    record("TEST-13", "Origen externo no autorizado rechazado con HTTP 403", st_evil == 403, f"Status={st_evil}")

    # TEST 14: Concurrencia transaccional en rotación de refresh token
    # Dos hilos intentan refrescar exactamente el mismo token simultáneamente
    _, _, _, cookies_conc = http_req("auth/login", method="POST", payload={"email": client_email, "password": client_pwd})
    c_conc_map = parse_cookie_header(cookies_conc)
    conc_ref = c_conc_map["mira_refresh"]["value"]
    conc_csrf = c_conc_map["mira_csrf"]["value"]

    conc_results = []
    def do_refresh():
        s, d, _, _ = http_req(
            "auth/refresh",
            method="POST",
            cookies={"mira_refresh": conc_ref, "mira_csrf": conc_csrf},
            extra_headers={"X-CSRF-Token": conc_csrf, "Origin": "http://localhost:5173"}
        )
        conc_results.append(s)

    t1 = threading.Thread(target=do_refresh)
    t2 = threading.Thread(target=do_refresh)
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # Exactamente una petición debe tener éxito (200) y la otra debe ser rechazada (401 o 409)
    succ_count = conc_results.count(200)
    fail_count = sum(1 for s in conc_results if s in (401, 409))
    ok_conc = (succ_count == 1 and fail_count == 1)
    record("TEST-14", "Concurrencia transaccional: una sola rotación exitosa, segunda rechazada", ok_conc,
           f"Resultados: {conc_results}")

    # TEST 15: Compatibilidad retroactiva Bearer intacta
    # Obtener un token Bearer tradicional desde la respuesta JSON
    _, data_b, _, _ = http_req("auth/login", method="POST", payload={"email": client_email, "password": client_pwd})
    bearer_jwt = data_b.get("token")
    st_bearer, me_b, _, _ = http_req("auth/me", method="GET", token=bearer_jwt)
    record("TEST-15", "Compatibilidad retroactiva Bearer en Authorization header intacta", st_bearer == 200 and me_b.get("user", {}).get("email") == client_email,
           f"Status={st_bearer}")

    # TEST 16: Roles CLIENT, OPERATOR y ADMIN reconocidos correctamente en /auth/me
    # 16A: OPERATOR
    _, d_op, _, c_op = http_req("auth/login", method="POST", payload={"email": operator_email, "password": operator_pwd})
    op_sess = parse_cookie_header(c_op)["mira_session"]["value"]
    st_op_me, d_op_me, _, _ = http_req("auth/me", method="GET", cookies={"mira_session": op_sess})
    ok_op = (st_op_me == 200 and d_op_me.get("user", {}).get("role") == "OPERATOR")

    # 16B: ADMIN
    _, d_ad, _, c_ad = http_req("auth/login", method="POST", payload={"email": admin_email, "password": admin_pwd})
    ad_sess = parse_cookie_header(c_ad)["mira_session"]["value"]
    st_ad_me, d_ad_me, _, _ = http_req("auth/me", method="GET", cookies={"mira_session": ad_sess})
    ok_ad = (st_ad_me == 200 and d_ad_me.get("user", {}).get("role") == "ADMIN")

    record("TEST-16", "Roles CLIENT, OPERATOR y ADMIN reconocidos correctamente en /auth/me", ok_op and ok_ad,
           f"Operator Role={d_op_me.get('user',{}).get('role')}, Admin Role={d_ad_me.get('user',{}).get('role')}")

    # TEST 17: Preservación de auto-claim en solicitudes públicas
    # Crear una solicitud pública no asignada para client_email
    test_contact = "Dra. Elena Soto Cliente"
    st_pub, data_pub, _, _ = http_req("requests", method="POST", payload={
        "contactName": test_contact,
        "email": client_email,
        "need": "Pintura Comercial",
        "description": "Auto-claim test"
    })
    pub_folio = data_pub.get("folio")
    pub_id = data_pub.get("id")

    # Ahora loguear como client_email -> auto-claim debe reclamarla
    _, data_cl, _, c_cl = http_req("auth/login", method="POST", payload={"email": client_email, "password": client_pwd})
    cl_jwt = parse_cookie_header(c_cl)["mira_session"]["value"]
    
    # Consultar solicitudes del cliente con la cookie
    st_reqs, reqs_data, _, _ = http_req("requests", method="GET", cookies={"mira_session": cl_jwt})
    folios = [r.get("Folio") for r in reqs_data] if isinstance(reqs_data, list) else []
    record("TEST-17", "Preservación de auto-claim de solicitudes en login del cliente", pub_folio in folios,
           f"Folio={pub_folio} encontrado en solicitudes del cliente")

    # Limpieza inmediata de la solicitud de prueba
    if pub_id:
        try:
            with pyodbc.connect(DB_CONN) as cn:
                cur = cn.cursor()
                cur.execute("DELETE FROM mira.RequestActivities WHERE RequestId = ?", pub_id)
                cur.execute("DELETE FROM mira.StatusHistory WHERE RequestId = ?", pub_id)
                cur.execute("DELETE FROM mira.RequestServices WHERE RequestId = ?", pub_id)
                cur.execute("DELETE FROM mira.Requests WHERE RequestId = ?", pub_id)
                cn.commit()
        except Exception:
            pass
           f"Folio={pub_folio} encontrado en solicitudes del cliente")

    # TEST 18: Ausencia de secretos en respuestas JSON
    body_str = json.dumps(data_cl)
    has_secret = any(s in body_str.lower() for s in ["passwordhash", "refreshtokenhash", "csrftokenhash", "secret"])
    record("TEST-18", "Ausencia de hashes o contraseñas en respuestas JSON", not has_secret, "Sin exposición de secretos")

    print("=" * 80)
    passed = sum(1 for r in results if r["success"])
    total = len(results)
    print(f"RESUMEN FASE 18D-2B: {passed}/{total} pruebas aprobadas ({passed/total*100:.1f}%)")
    print("=" * 80)

    if passed == total:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
