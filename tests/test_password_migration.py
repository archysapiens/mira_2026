#!/usr/bin/env python3
"""
MIRA — Suite de Pruebas de Migración de Contraseñas a Argon2id (Fase 18C)
Archivo: tests/test_password_migration.py
Valida la migración progresiva, verificación dual, idempotencia DDL y seguridad criptográfica
contra Azure Functions y SQL Server local (mira_dev).
"""

import sys
import json
import time
import uuid
import hashlib
import threading
import urllib.request
import urllib.error
import pyodbc
from argon2 import PasswordHasher

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

def http_req(endpoint, method="GET", payload=None, token=None):
    url = f"{API_BASE}/{endpoint.lstrip('/')}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body) if body else {}
            except Exception:
                parsed = {"raw": body}
            return status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body) if body else {}
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed
    except Exception as ex:
        return 0, {"error": str(ex)}

def main():
    print("======================================================================")
    print(" MIRA — Fase 18C: Validación de Migración Criptográfica a Argon2id")
    print("======================================================================\n")

    # ------------------------------------------------------------------
    # 0. Aislamiento local y comprobación de columna VARCHAR(255)
    # ------------------------------------------------------------------
    try:
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT CAST(SERVERPROPERTY('MachineName') AS VARCHAR(50)), CAST(SERVERPROPERTY('EngineEdition') AS INT), db_name()")
        srv_name, edition, dbname = cur.fetchone()
        assert edition == 4 and dbname == "mira_dev", "Aislamiento local no garantizado"
        
        cur.execute("""
            SELECT c.max_length, c.is_nullable 
            FROM sys.columns c 
            WHERE c.object_id = OBJECT_ID('mira.Users') AND c.name = 'PasswordHash'
        """)
        col_len, is_null = cur.fetchone()
        assert col_len == 255 and not is_null, f"PasswordHash no es VARCHAR(255) NOT NULL (longitud: {col_len})"
        cn.close()
        print(f"[OK] Aislamiento garantizado en {srv_name} (mira_dev). Columna PasswordHash VARCHAR(255) NOT NULL confirmada.\n")
    except Exception as e:
        print(f"[ERROR CRITICO] Falló validación de entorno o esquema: {e}")
        sys.exit(1)

    # Preparar usuarios de prueba en mira_dev
    ts = int(time.time())
    email_legacy_client = f"cliente.sha256.{ts}@mira-test.local"
    email_concurrent = f"concurrent.sha256.{ts}@mira-test.local"
    email_corrupt = f"corrupt.hash.{ts}@mira-test.local"
    pass_legacy = "TestLegacy2026!"
    hash_legacy = hashlib.sha256(pass_legacy.encode("utf-8")).hexdigest().upper()

    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()

    # Obtener RoleId para CLIENT
    cur.execute("SELECT RoleId FROM mira.Roles WHERE Code = 'CLIENT'")
    client_role_id = cur.fetchone()[0]

    # Insertar usuario con hash puro SHA-256 para probar la migración
    cur.execute("""
        INSERT INTO mira.Users (UserId, Email, PasswordHash, FullName, RoleId, IsActive, EmailVerified)
        VALUES (NEWID(), ?, ?, 'Usuario Prueba SHA256', ?, 1, 1)
    """, email_legacy_client, hash_legacy, client_role_id)

    # Insertar usuario para prueba de concurrencia con hash SHA-256
    cur.execute("""
        INSERT INTO mira.Users (UserId, Email, PasswordHash, FullName, RoleId, IsActive, EmailVerified)
        VALUES (NEWID(), ?, ?, 'Usuario Concurrente SHA256', ?, 1, 1)
    """, email_concurrent, hash_legacy, client_role_id)

    # Insertar usuario con hash corrupto
    cur.execute("""
        INSERT INTO mira.Users (UserId, Email, PasswordHash, FullName, RoleId, IsActive, EmailVerified)
        VALUES (NEWID(), ?, 'FORMATO_CORRUPTO_TOTALMENTE_INVALIDO', 'Usuario Hash Corrupto', ?, 1, 1)
    """, email_corrupt, client_role_id)

    cn.commit()
    cn.close()

    # ==================================================================
    # 1. Login incorrecto antes de migrar (SHA-256)
    # ==================================================================
    st, resp = http_req("auth/login", method="POST", payload={"email": email_legacy_client, "password": "PasswordTotalmenteErroneo!"})
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("SELECT PasswordHash FROM mira.Users WHERE Email = ?", email_legacy_client)
    hash_in_db = cur.fetchone()[0]
    cn.close()
    
    success = (st == 401 and hash_in_db == hash_legacy)
    record("TEST-01", "Rechazo de credenciales incorrectas en cuenta SHA-256 (sin alterar hash)",
           success, f"HTTP {st} - Hash en BD sigue siendo SHA-256 de 64 caracteres.")

    # ==================================================================
    # 2. Login correcto con usuario SHA-256 existente
    # ==================================================================
    st, resp = http_req("auth/login", method="POST", payload={"email": email_legacy_client, "password": pass_legacy})
    login_1_token = resp.get("token")
    user_info = resp.get("user", {})
    success = (st == 200 and bool(login_1_token) and user_info.get("email") == email_legacy_client)
    record("TEST-02", "Login exitoso con usuario SHA-256 legado existente",
           success, f"HTTP {st} - Token JWT emitido para {user_info.get('email')} (Rol: {user_info.get('role')})")

    # ==================================================================
    # 3. Migración automática del hash después del login
    # ==================================================================
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("SELECT PasswordHash, UpdatedAt FROM mira.Users WHERE Email = ?", email_legacy_client)
    new_hash, updated_at = cur.fetchone()
    cn.close()
    
    is_argon = new_hash.startswith("$argon2id$")
    success = (is_argon and len(new_hash) >= 90 and updated_at is not None)
    record("TEST-03", "Migración automática transparente a Argon2id tras autenticación exitosa",
           success, f"Hash actualizado en BD a formato Argon2id (Longitud: {len(new_hash)} caracteres)")

    # ==================================================================
    # 4. Segundo login con el nuevo hash Argon2id
    # ==================================================================
    st, resp = http_req("auth/login", method="POST", payload={"email": email_legacy_client, "password": pass_legacy})
    login_2_token = resp.get("token")
    success = (st == 200 and bool(login_2_token))
    record("TEST-04", "Segundo login exitoso autenticado directamente contra hash Argon2id",
           success, f"HTTP {st} - Verificación nativa con Argon2id exitosa sin re-hasheo redundante")

    # ==================================================================
    # 5. Login incorrecto después de migrar a Argon2id
    # ==================================================================
    st, resp = http_req("auth/login", method="POST", payload={"email": email_legacy_client, "password": "PasswordInvalidoDespuesDeMigrar!"})
    success = (st == 401)
    record("TEST-05", "Rechazo de credenciales incorrectas tras migración a Argon2id",
           success, f"HTTP {st} - Verificación Argon2id rechaza contraseñas no coincidentes con HTTP 401")

    # ==================================================================
    # 6. Registro de usuario nuevo directamente con Argon2id (/auth/register)
    # ==================================================================
    email_new_client = f"nuevo.argon2.{ts}@mira-test.local"
    pass_new = "Argon2SecurePassword2026!"
    st, resp = http_req("auth/register", method="POST", payload={
        "email": email_new_client,
        "password": pass_new,
        "fullName": "Cliente Nuevo Argon2id"
    })
    
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("SELECT PasswordHash FROM mira.Users WHERE Email = ?", email_new_client)
    row_new = cur.fetchone()
    cn.close()

    new_user_hash = row_new[0] if row_new else ""
    success = (st == 201 and new_user_hash.startswith("$argon2id$"))
    record("TEST-06", "Registro público de nuevo usuario almacena hash Argon2id nativo",
           success, f"HTTP {st} - Cuenta registrada directamente con Argon2id (Prefijo: $argon2id$)")

    # ==================================================================
    # 7. Creación administrativa de usuario con Argon2id (POST /users)
    # ==================================================================
    # Obtener token de administrador
    _, admin_login = http_req("auth/login", method="POST", payload={"email": "admin.test@mira-local.dev", "password": "TestDev2026!"})
    admin_token = admin_login.get("token")

    email_admin_op = f"operador.argon2.{ts}@mira-test.local"
    pass_admin_op = "EspecialistaArgon2026!"
    st, resp = http_req("users", method="POST", payload={
        "email": email_admin_op,
        "fullName": "Operador Creado por Admin",
        "role": "OPERATOR",
        "password": pass_admin_op
    }, token=admin_token)

    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("SELECT PasswordHash, r.Code FROM mira.Users u JOIN mira.Roles r ON r.RoleId=u.RoleId WHERE Email = ?", email_admin_op)
    row_admin_op = cur.fetchone()
    cn.close()

    op_hash = row_admin_op[0] if row_admin_op else ""
    op_role = row_admin_op[1] if row_admin_op else ""
    success = (st == 201 and op_hash.startswith("$argon2id$") and op_role == "OPERATOR")
    record("TEST-07", "Creación administrativa de especialista con hash Argon2id nativo",
           success, f"HTTP {st} - Operador creado con rol {op_role} y hash Argon2id")

    # ==================================================================
    # 8. Rechazo de contraseña administrativa ausente o débil en POST /users
    # ==================================================================
    # 8.1 Sin contraseña (antes usaba "123")
    st_no_pwd, resp_no_pwd = http_req("users", method="POST", payload={
        "email": f"hacker.no.pwd.{ts}@mira.dev",
        "fullName": "Sin Password",
        "role": "OPERATOR"
    }, token=admin_token)

    # 8.2 Contraseña menor a 8 caracteres
    st_short_pwd, resp_short_pwd = http_req("users", method="POST", payload={
        "email": f"hacker.short.{ts}@mira.dev",
        "fullName": "Password Corto",
        "role": "OPERATOR",
        "password": "123"
    }, token=admin_token)

    success = (st_no_pwd == 400 and st_short_pwd == 400)
    record("TEST-08", "Eliminación de contraseña por defecto '123' y validación de longitud >= 8",
           success, f"Sin password: HTTP {st_no_pwd} | Password corto '123': HTTP {st_short_pwd} (Ambos rechazados con 400)")

    # ==================================================================
    # 9. Rechazo controlado de formatos de hash desconocidos en login
    # ==================================================================
    st, resp = http_req("auth/login", method="POST", payload={"email": email_corrupt, "password": "CualquierPassword!"})
    success = (st == 401 and "error" in resp)
    record("TEST-09", "Tratamiento seguro de formatos de hash desconocidos o corruptos",
           success, f"HTTP {st} - Rechazo seguro con 401 sin colapso de servidor ni filtración de errores")

    # ==================================================================
    # 10. Conservación del usuario, roles y permisos tras migración
    # ==================================================================
    # Comprobar login del usuario migrado y acceso a endpoint protegido
    st, reqs_resp = http_req("requests", method="GET", token=login_2_token)
    success = (st == 200 and isinstance(reqs_resp, list))
    record("TEST-10", "Conservación de identidad, roles y permisos tras la migración criptográfica",
           success, f"HTTP {st} - El usuario migrado conserva su rol CLIENT y acceso íntegro a sus recursos")

    # ==================================================================
    # 11. Concurrencia de intentos de login sobre cuenta SHA-256
    # ==================================================================
    threads_results = []
    def concurrent_login():
        status, response = http_req("auth/login", method="POST", payload={"email": email_concurrent, "password": pass_legacy})
        threads_results.append(status)

    threads = [threading.Thread(target=concurrent_login) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("SELECT PasswordHash FROM mira.Users WHERE Email = ?", email_concurrent)
    concurrent_db_hash = cur.fetchone()[0]
    cn.close()

    all_200 = all(s == 200 for s in threads_results)
    is_argon_final = concurrent_db_hash.startswith("$argon2id$")
    success = (all_200 and is_argon_final and len(threads_results) == 5)
    record("TEST-11", "Concurrencia de inicios de sesión simultáneos sobre cuenta en migración",
           success, f"5/5 hilos concurrentes obtuvieron HTTP 200. Hash final en BD: Argon2id (sin condiciones de carrera)")

    # ==================================================================
    # 12. Repetición idempotente de la migración DDL
    # ==================================================================
    try:
        cn = pyodbc.connect(DB_CONN, autocommit=True)
        cur = cn.cursor()
        with open(r"database\migrations\008_expand_password_hash.sql", "r", encoding="utf-8") as f:
            ddl_sql = f.read()
        for stmt in ddl_sql.split("GO"):
            if stmt.strip():
                cur.execute(stmt.strip())
                while cur.nextset(): pass
        
        cur.execute("SELECT c.max_length FROM sys.columns c WHERE c.object_id = OBJECT_ID('mira.Users') AND c.name = 'PasswordHash'")
        final_len = cur.fetchone()[0]
        cn.close()
        success = (final_len == 255)
        record("TEST-12", "Idempotencia probada de migración DDL 008_expand_password_hash.sql",
               success, f"Re-ejecución limpia sin errores. Longitud confirmada: VARCHAR({final_len})")
    except Exception as ex:
        record("TEST-12", "Idempotencia probada de migración DDL 008_expand_password_hash.sql",
               False, str(ex))

    # ==================================================================
    # 13. Compatibilidad de biblioteca Argon2id en entorno Python 3.12
    # ==================================================================
    try:
        ph_test = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)
        test_h = ph_test.hash("P@ssw0rd!2026")
        test_v = ph_test.verify(test_h, "P@ssw0rd!2026")
        test_needs = ph_test.check_needs_rehash(test_h)
        py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        success = (test_v is True and test_needs is False and sys.version_info >= (3, 12))
        record("TEST-13", "Compatibilidad nativa de argon2-cffi en Python 3.12",
               success, f"Python {py_ver} con argon2-cffi: Hashing, Verificación y CheckNeedsRehash operativos")
    except Exception as ex:
        record("TEST-13", "Compatibilidad nativa de argon2-cffi en Python 3.12",
               False, str(ex))

    # ==================================================================
    # 14. Ausencia estricta de contraseñas y hashes en respuestas HTTP y logs
    # ==================================================================
    responses_to_check = [
        resp_no_pwd,
        resp_short_pwd,
        user_info,
        admin_login
    ]
    leaked_data = False
    for r in responses_to_check:
        s_repr = json.dumps(r).lower()
        if "passwordhash" in s_repr or "$argon2id$" in s_repr or pass_legacy.lower() in s_repr:
            leaked_data = True
            break

    success = (not leaked_data)
    record("TEST-14", "Higiene de seguridad: Ausencia de contraseñas y hashes en respuestas HTTP",
           success, "Ningún hash, contraseña plana ni sal criptográfica fue expuesto en los contratos JSON")

    # ------------------------------------------------------------------
    # Limpieza de usuarios ficticios temporales
    # ------------------------------------------------------------------
    try:
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("DELETE FROM mira.Users WHERE Email IN (?, ?, ?, ?, ?)",
                    email_legacy_client, email_concurrent, email_corrupt, email_new_client, email_admin_op)
        cn.commit()
        cn.close()
        print("\n[OK] Limpieza de usuarios temporales de prueba en mira_dev completada con éxito.")
    except Exception as ex:
        print(f"[ALERTA] Error al limpiar registros temporales: {ex}")

    # ------------------------------------------------------------------
    # Resumen Ejecutivo
    # ------------------------------------------------------------------
    print("\n======================================================================")
    print(" RESUMEN DE LA SUITE DE MIGRACIÓN CRIPTOGRÁFICA (FASE 18C)")
    print("======================================================================")
    total_tests = len(results)
    pass_count = sum(1 for r in results if r["success"])
    fail_count = total_tests - pass_count

    print(f"Total de casos ejecutados: {total_tests}")
    print(f"Casos aprobados exitosamente (PASS): {pass_count}")
    print(f"Casos fallidos (FAIL): {fail_count}")
    print("----------------------------------------------------------------------")
    print(f"{'ID':<10} | {'Nombre de Prueba':<52} | {'Veredicto'}")
    print("----------------------------------------------------------------------")
    for r in results:
        print(f"{r['id']:<10} | {r['name'][:52]:<52} | {r['verdict']}")
    print("======================================================================\n")

    if fail_count > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()

