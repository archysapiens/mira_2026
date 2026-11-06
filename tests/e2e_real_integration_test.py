#!/usr/bin/env python3
"""
MIRA — Suite de Pruebas Integrales Reales contra SQL Server Local (mira_dev)
Archivo: tests/e2e_real_integration_test.py
Utiliza urllib estándar de Python para evitar dependencias externas.
"""

import sys
import json
import time
import urllib.request
import urllib.error
import pyodbc

API_DIRECT = "http://localhost:7071/api"
API_PROXY  = "http://localhost:5173/api"
DB_CONN = r"Driver={ODBC Driver 17 for SQL Server};Server=.\SQLEXPRESS;Database=mira_dev;Trusted_Connection=yes;"

results = []

def record(test_id, name, success, details=""):
    results.append({
        "id": test_id,
        "name": name,
        "status": "PASS" if success else "FAIL",
        "details": details
    })
    status_icon = "[PASS]" if success else "[FAIL]"
    print(f"{status_icon} {test_id}: {name}")
    if details:
        print(f"       -> {details}")

def http_req(url, method="GET", payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            return status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed

def main():
    print("======================================================================")
    print(" MIRA — Fase 15: Pruebas Integrales Reales con SQL Server Local")
    print("======================================================================\n")

    # ------------------------------------------------------------------
    # 0. Verificación Previa de Aislamiento
    # ------------------------------------------------------------------
    try:
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT CAST(SERVERPROPERTY('MachineName') AS VARCHAR(50)), CAST(SERVERPROPERTY('EngineEdition') AS INT), db_name()")
        row = cur.fetchone()
        cn.close()
        assert row[1] == 4, "EngineEdition debe ser 4 (Express)"
        assert row[2] == "mira_dev", "La base de datos debe ser mira_dev"
        record("SEC-01", "Verificación de Aislamiento Local de SQL Server", True, f"Servidor: {row[0]}, Edición: {row[1]}, BD: {row[2]}")
    except Exception as e:
        record("SEC-01", "Verificación de Aislamiento Local de SQL Server", False, str(e))
        print("ABORTANDO: No se pudo garantizar aislamiento local.")
        sys.exit(1)

    # ------------------------------------------------------------------
    # 1. Autenticación: Login correcto (Semilla)
    # ------------------------------------------------------------------
    client_verif_token = None
    try:
        status, data = http_req(f"{API_DIRECT}/auth/login", method="POST", payload={
            "email": "cliente.verificado@mira-local.dev",
            "password": "TestDev2026!"
        })
        assert status == 200
        assert "token" in data
        assert data["user"]["email"] == "cliente.verificado@mira-local.dev"
        assert data["user"]["role"] == "CLIENT"
        assert data["user"]["emailVerified"] is True
        client_verif_token = data["token"]
        record("AUTH-01", "Login exitoso con usuario verificado existente", True, f"Token recibido (rol: {data['user']['role']})")
    except Exception as e:
        record("AUTH-01", "Login exitoso con usuario verificado existente", False, str(e))

    # ------------------------------------------------------------------
    # 2. Autenticación: Credenciales incorrectas
    # ------------------------------------------------------------------
    try:
        status, data = http_req(f"{API_DIRECT}/auth/login", method="POST", payload={
            "email": "cliente.verificado@mira-local.dev",
            "password": "PasswordTotalmenteErroneo!"
        })
        assert status == 401
        record("AUTH-02", "Rechazo de credenciales incorrectas", True, f"HTTP {status} - {data.get('error')}")
    except Exception as e:
        record("AUTH-02", "Rechazo de credenciales incorrectas", False, str(e))

    # ------------------------------------------------------------------
    # 3. Autenticación: Registro de nuevo cliente
    # ------------------------------------------------------------------
    new_client_email = f"cliente.nuevo.{int(time.time())}@mira-test.local"
    new_client_id = None
    try:
        status, data = http_req(f"{API_DIRECT}/auth/register", method="POST", payload={
            "email": new_client_email,
            "password": "TestDev2026!",
            "fullName": "Ing. Sofía Valenzuela Prueba",
            "phone": "7224445566",
            "company": "Laboratorios Valenzuela SA"
        })
        assert status == 201
        assert "id" in data
        assert data["email"] == new_client_email
        assert data["emailVerified"] is False
        new_client_id = data["id"]
        record("AUTH-03", "Registro de nuevo cliente en mira_dev", True, f"Usuario creado ID {new_client_id} (emailVerified: False)")
    except Exception as e:
        record("AUTH-03", "Registro de nuevo cliente en mira_dev", False, str(e))

    # ------------------------------------------------------------------
    # 4. Autenticación: Prevención de correo duplicado
    # ------------------------------------------------------------------
    try:
        status, data = http_req(f"{API_DIRECT}/auth/register", method="POST", payload={
            "email": new_client_email,
            "password": "TestDev2026!",
            "fullName": "Intento Duplicado",
            "company": "Duplicado SA"
        })
        assert status == 409
        record("AUTH-04", "Prevención de correo duplicado en registro", True, f"HTTP {status} - {data.get('error')}")
    except Exception as e:
        record("AUTH-04", "Prevención de correo duplicado en registro", False, str(e))

    # ------------------------------------------------------------------
    # 5. Autenticación: Rechazo de token inválido
    # ------------------------------------------------------------------
    try:
        status, data = http_req(f"{API_DIRECT}/requests", method="GET", token="token_falso_invalido_123")
        assert status == 401
        record("AUTH-05", "Rechazo de token JWT inválido", True, f"HTTP {status} Unauthorized")
    except Exception as e:
        record("AUTH-05", "Rechazo de token JWT inválido", False, str(e))

    # ------------------------------------------------------------------
    # 6. OTP: Solicitud de código de verificación
    # ------------------------------------------------------------------
    generated_code = None
    try:
        status, data = http_req(f"{API_DIRECT}/auth/request-email-verification", method="POST", payload={
            "email": new_client_email
        })
        assert status == 200
        assert data["sent"] is True
        assert "devCode" in data and data["devCode"] is not None
        generated_code = data["devCode"]
        record("OTP-01", "Solicitud de código OTP en modo desarrollo", True, f"devCode recibido: {generated_code} (expira en {data['expiresInMinutes']}m)")
    except Exception as e:
        record("OTP-01", "Solicitud de código OTP en modo desarrollo", False, str(e))

    # ------------------------------------------------------------------
    # 7. OTP: Rechazo de código incorrecto
    # ------------------------------------------------------------------
    try:
        status, data = http_req(f"{API_DIRECT}/auth/verify-email", method="POST", payload={
            "email": new_client_email,
            "code": "000000"
        })
        assert status == 400
        record("OTP-02", "Rechazo de código OTP erróneo", True, f"HTTP {status} - {data.get('error')}")
    except Exception as e:
        record("OTP-02", "Rechazo de código OTP erróneo", False, str(e))

    # ------------------------------------------------------------------
    # 8. OTP: Verificación exitosa de código válido
    # ------------------------------------------------------------------
    try:
        status, data = http_req(f"{API_DIRECT}/auth/verify-email", method="POST", payload={
            "email": new_client_email,
            "code": generated_code
        })
        assert status == 200
        assert data["verified"] is True
        assert data["emailVerified"] is True
        # Verificar en base de datos mira_dev que EmailVerified = 1
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT EmailVerified FROM mira.Users WHERE Email = ?", new_client_email)
        db_verified = cur.fetchone()[0]
        cn.close()
        assert db_verified == 1
        record("OTP-03", "Verificación exitosa de correo OTP y actualización en BD", True, "mira.Users.EmailVerified = 1 confirmado en BD")
    except Exception as e:
        record("OTP-03", "Verificación exitosa de correo OTP y actualización en BD", False, str(e))

    # ------------------------------------------------------------------
    # 9. Solicitudes: Creación pública anónima
    # ------------------------------------------------------------------
    claim_test_email = f"cliente.claim.{int(time.time())}@mira-test.local"
    created_folio = None
    created_request_id = None
    try:
        status, data = http_req(f"{API_DIRECT}/requests", method="POST", payload={
            "contactName": "Ing. Miguel Ángel Huérfano",
            "email": claim_test_email,
            "phone": "7229998877",
            "company": "Comercializadora Futura SA",
            "location": "Toluca, Estado de México",
            "need": "Limpieza y mantenimiento de silos",
            "urgency": "Alta",
            "description": "Limpieza integral de 3 silos de harina. Requiere atención inmediata.",
            "services": ["SILOS"]
        })
        assert status == 201
        assert "folio" in data
        assert data["folio"].startswith("MIRA-2026-")
        created_folio = data["folio"]
        # Obtener RequestId de la BD
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT RequestId, ClientUserId, Status FROM mira.Requests WHERE Folio = ?", created_folio)
        r_row = cur.fetchone()
        cn.close()
        created_request_id = str(r_row[0])
        assert r_row[1] is None  # Debe ser huérfana
        assert r_row[2] == 'E'   # Estatus Enviada
        record("REQ-01", "Creación anónima de solicitud y generación de folio", True, f"Folio generado: {created_folio} (ClientUserId: NULL, Status: 'E')")
    except Exception as e:
        record("REQ-01", "Creación anónima de solicitud y generación de folio", False, str(e))

    # ------------------------------------------------------------------
    # 10. Solicitudes: Registro de cliente con mismo email y vinculación
    # ------------------------------------------------------------------
    claim_user_token = None
    try:
        # Registrar cuenta con el mismo email de la solicitud huérfana
        reg_status, user_data = http_req(f"{API_DIRECT}/auth/register", method="POST", payload={
            "email": claim_test_email,
            "password": "TestDev2026!",
            "fullName": "Ing. Miguel Ángel Huérfano",
            "phone": "7229998877",
            "company": "Comercializadora Futura SA"
        })
        assert reg_status == 201

        # Iniciar sesión para obtener el token JWT
        login_status, login_data = http_req(f"{API_DIRECT}/auth/login", method="POST", payload={
            "email": claim_test_email,
            "password": "TestDev2026!"
        })
        assert login_status == 200
        claim_user_token = login_data["token"]

        # Verificar correo inmediatamente con devCode (esto vincula la primera solicitud huérfana)
        _, otp_req = http_req(f"{API_DIRECT}/auth/request-email-verification", method="POST", payload={"email": claim_test_email})
        dev_code = otp_req["devCode"]
        verify_status, verify_data = http_req(f"{API_DIRECT}/auth/verify-email", method="POST", payload={"email": claim_test_email, "code": dev_code})
        assert verify_status == 200
        assert verify_data["claimedCount"] >= 1
        assert created_folio in verify_data["claimedFolios"]

        # Iniciar sesión para obtener el token verificado
        _, login_verif_data = http_req(f"{API_DIRECT}/auth/login", method="POST", payload={
            "email": claim_test_email,
            "password": "TestDev2026!"
        })
        verified_claim_token = login_verif_data["token"]

        # Crear una segunda solicitud anónima con el usuario ya logueado para probar el endpoint /requests/claim
        _, req2_data = http_req(f"{API_DIRECT}/requests", method="POST", payload={
            "contactName": "Ing. Miguel Ángel Huérfano",
            "email": claim_test_email,
            "phone": "7229998877",
            "company": "Comercializadora Futura SA",
            "location": "Metepec, Estado de México",
            "need": "Recubrimientos epóxicos",
            "urgency": "Normal",
            "description": "Segunda solicitud posterior para probar claimRequests explícito.",
            "services": ["EPOXY"]
        })
        created_folio_2 = req2_data["folio"]

        # Ejecutar claimRequests explícito con el token de sesión verificado (sin re-loguearse)
        claim_status, claim_data = http_req(f"{API_DIRECT}/requests/claim", method="POST", token=verified_claim_token)
        assert claim_status == 200
        assert claim_data["claimedCount"] >= 1
        assert created_folio_2 in claim_data["claimedFolios"]

        # Confirmar en BD que ambos folios están vinculados al usuario
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT ClientUserId FROM mira.Requests WHERE Folio = ?", created_folio_2)
        linked_user_id = cur.fetchone()[0]
        cn.close()
        assert linked_user_id is not None
        record("REQ-02", "Vinculación automática de solicitudes huérfanas (auto-claim y claimRequests)", True, f"Folios {created_folio} y {created_folio_2} vinculados a UserId: {linked_user_id}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        record("REQ-02", "Vinculación automática de solicitudes huérfanas (claimRequests)", False, str(e))

    # ------------------------------------------------------------------
    # 11. Solicitudes: Consulta de solicitudes propias (Aislamiento de clientes)
    # ------------------------------------------------------------------
    try:
        status, data = http_req(f"{API_DIRECT}/requests", method="GET", token=client_verif_token)
        assert status == 200
        for req in data:
            assert req["ContactName"] == "Dra. Elena Soto Cliente"
        record("REQ-03", "Aislamiento de solicitudes: Cliente solo consulta las propias", True, f"{len(data)} solicitudes propias recuperadas sin filtración de otros clientes")
    except Exception as e:
        record("REQ-03", "Aislamiento de solicitudes: Cliente solo consulta las propias", False, str(e))

    # ------------------------------------------------------------------
    # 12. Operador: Login y consulta de solicitudes asignadas
    # ------------------------------------------------------------------
    operator_token = None
    try:
        status, data = http_req(f"{API_DIRECT}/auth/login", method="POST", payload={
            "email": "operador.test@mira-local.dev",
            "password": "TestDev2026!"
        })
        assert status == 200
        assert data["user"]["role"] == "OPERATOR"
        operator_token = data["token"]
        # Consultar solicitudes asignadas al operador
        _, op_reqs = http_req(f"{API_DIRECT}/requests", method="GET", token=operator_token)
        for op_r in op_reqs:
            assert op_r["OperatorName"] == "Ing. Carlos Especialista"
        record("OP-01", "Login de Operador y consulta exclusiva de servicios asignados", True, f"{len(op_reqs)} solicitudes asignadas recuperadas")
    except Exception as e:
        record("OP-01", "Login de Operador y consulta exclusiva de servicios asignados", False, str(e))

    # ------------------------------------------------------------------
    # 13. Operador: Registro y consulta de notas técnicas
    # ------------------------------------------------------------------
    try:
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT RequestId FROM mira.Requests WHERE Folio = 'MIRA-2026-000003'")
        req3_id = str(cur.fetchone()[0])
        cn.close()

        note_text = f"Avance técnico verificado por el operador en sitio a las {time.strftime('%H:%M:%S')}."
        note_status, _ = http_req(f"{API_DIRECT}/requests/{req3_id}/notes",
                                  method="POST",
                                  payload={"note": note_text},
                                  token=operator_token)
        assert note_status == 201

        # Consultar notas técnicas
        _, get_notes = http_req(f"{API_DIRECT}/requests/{req3_id}/notes",
                                method="GET",
                                token=operator_token)
        assert len(get_notes) >= 2
        assert get_notes[0]["Note"] == note_text
        record("OP-02", "Registro y consulta cronológica de notas técnicas en bitácora", True, f"Nota registrada por {get_notes[0]['Author']}")
    except Exception as e:
        record("OP-02", "Registro y consulta cronológica de notas técnicas en bitácora", False, str(e))

    # ------------------------------------------------------------------
    # 14. Administrador: Login y consola de usuarios
    # ------------------------------------------------------------------
    admin_token = None
    try:
        status, data = http_req(f"{API_DIRECT}/auth/login", method="POST", payload={
            "email": "admin.test@mira-local.dev",
            "password": "TestDev2026!"
        })
        assert status == 200
        assert data["user"]["role"] == "ADMIN"
        admin_token = data["token"]
        # Consultar lista de usuarios
        users_status, users_list = http_req(f"{API_DIRECT}/users", method="GET", token=admin_token)
        assert users_status == 200
        assert len(users_list) >= 4
        record("ADM-01", "Acceso administrativo y gestión de usuarios del sistema", True, f"{len(users_list)} usuarios listados")
    except Exception as e:
        record("ADM-01", "Acceso administrativo y gestión de usuarios del sistema", False, str(e))

    # ------------------------------------------------------------------
    # 15. Administrador: Asignación de operador a solicitud
    # ------------------------------------------------------------------
    try:
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT UserId FROM mira.Users WHERE Email = 'operador.test@mira-local.dev'")
        op_id_str = str(cur.fetchone()[0])
        cn.close()

        assign_status, _ = http_req(f"{API_DIRECT}/requests/{created_request_id}/assign",
                                    method="PATCH",
                                    payload={"operatorId": op_id_str},
                                    token=admin_token)
        assert assign_status == 200

        # Verificar en BD que Status = 'A' y AssignedOperatorId está asignado
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT Status, AssignedOperatorId FROM mira.Requests WHERE RequestId = ?", created_request_id)
        stat_row = cur.fetchone()
        cn.close()
        assert stat_row[0] == 'A'
        assert str(stat_row[1]).lower() == op_id_str.lower()
        record("ADM-02", "Asignación administrativa de especialista a solicitud", True, f"Solicitud {created_folio} asignada a operador (Status 'A')")
    except Exception as e:
        record("ADM-02", "Asignación administrativa de especialista a solicitud", False, str(e))

    # ------------------------------------------------------------------
    # 16. Operador: Actualización de estatus (Concluir servicio)
    # ------------------------------------------------------------------
    try:
        status_code, _ = http_req(f"{API_DIRECT}/requests/{created_request_id}/status",
                                  method="PATCH",
                                  payload={"status": "T", "comment": "Servicio de silos finalizado con pruebas de inocuidad."},
                                  token=operator_token)
        assert status_code == 200

        # Verificar en BD que Status = 'T' y se registró en StatusHistory
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("SELECT Status FROM mira.Requests WHERE RequestId = ?", created_request_id)
        current_status = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM mira.StatusHistory WHERE RequestId = ? AND NewStatus = 'T'", created_request_id)
        hist_count = cur.fetchone()[0]
        cn.close()
        assert current_status == 'T'
        assert hist_count >= 1
        record("OP-03", "Actualización de estatus de servicio a Concluido (T)", True, f"Folio {created_folio} actualizado a 'T' con registro en StatusHistory")
    except Exception as e:
        record("OP-03", "Actualización de estatus de servicio a Concluido (T)", False, str(e))

    # ------------------------------------------------------------------
    # 17. Seguridad RBAC: Rechazo de operaciones no autorizadas
    # ------------------------------------------------------------------
    try:
        # Cliente intenta consultar /users (Solo ADMIN)
        s1, _ = http_req(f"{API_DIRECT}/users", method="GET", token=client_verif_token)
        assert s1 == 403

        # Cliente intenta asignar operador (Solo ADMIN)
        s2, _ = http_req(f"{API_DIRECT}/requests/{created_request_id}/assign",
                         method="PATCH",
                         payload={"operatorId": "00000000-0000-0000-0000-000000000000"},
                         token=client_verif_token)
        assert s2 == 403

        # Operador intenta crear usuarios en /users (Solo ADMIN)
        s3, _ = http_req(f"{API_DIRECT}/users", method="POST",
                         payload={"email": "hacker@test.com", "role": "ADMIN"},
                         token=operator_token)
        assert s3 == 403

        record("RBAC-01", "Control de Acceso basado en Roles (RBAC) estricto", True, "403 Forbidden garantizado en rutas no autorizadas")
    except Exception as e:
        record("RBAC-01", "Control de Acceso basado en Roles (RBAC) estricto", False, str(e))

    # ------------------------------------------------------------------
    # 18. Integración React vía Proxy de Vite (http://localhost:5173/api)
    # ------------------------------------------------------------------
    try:
        s_health, proxy_health = http_req(f"{API_PROXY}/health", method="GET")
        assert s_health == 200
        assert proxy_health["status"] == "ok"

        # Login a través del proxy de Vite
        s_login, proxy_login = http_req(f"{API_PROXY}/auth/login", method="POST", payload={
            "email": "admin.test@mira-local.dev",
            "password": "TestDev2026!"
        })
        assert s_login == 200
        assert "token" in proxy_login

        # Dashboard a través del proxy de Vite
        s_dash, proxy_dash = http_req(f"{API_PROXY}/dashboard", method="GET", token=proxy_login["token"])
        assert s_dash == 200
        assert "counts" in proxy_dash

        record("PROXY-01", "Comunicación completa a través del Proxy local de Vite", True, f"Endpoints /health, /login y /dashboard validados vía puerto 5173 (counts: {proxy_dash['counts']})")
    except Exception as e:
        record("PROXY-01", "Comunicación completa a través del Proxy local de Vite", False, str(e))

    # ------------------------------------------------------------------
    # Resumen y Estadísticas
    # ------------------------------------------------------------------
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    print("\n======================================================================")
    print(f" RESUMEN DE PRUEBAS REALES: {passed} Aprobadas, {failed} Fallidas (Total: {len(results)})")
    print("======================================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
