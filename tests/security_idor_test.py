#!/usr/bin/env python3
"""
MIRA — Suite de Pruebas de Regresión de Seguridad y Control de Acceso (Fase 18B)
Archivo: tests/security_idor_test.py
Valida la mitigación de IDOR, robustez ante recursos inexistentes y pruebas funcionales
positivas de acceso por rol contra Azure Functions y SQL Server local (mira_dev).
"""

import sys
import json
import time
import urllib.request
import urllib.error
import pyodbc
from datetime import datetime, timedelta, timezone
import jwt

API_BASE = "http://localhost:7071/api"
DB_CONN = r"Driver={ODBC Driver 18 for SQL Server};Server=.\SQLEXPRESS;Database=mira_dev;Trusted_Connection=yes;TrustServerCertificate=yes;"
JWT_SECRET = "pTzLwG1WLQct15tGrJ0jDC8x5G2AVfZ5HoIKeQVq4Be7jyhqRClyGWdRz2MXuOFBGh9z5ycXkwD53N2ZUQg2mA=="

results = []

def record(test_id, name, current_code, expected_code, category="REGRESSION_IDOR", description=""):
    success = (current_code == expected_code)
    verdict = "PASS (Seguro)" if success else f"FAIL ({current_code} != {expected_code})"
    results.append({
        "id": test_id,
        "name": name,
        "current_code": current_code,
        "expected_code": expected_code,
        "success": success,
        "category": category,
        "verdict": verdict,
        "description": description
    })
    icon = "[PASS]" if success else "[FALLA]"
    print(f"{icon} {test_id}: {name}")
    print(f"       -> Actual: HTTP {current_code} | Esperado: HTTP {expected_code} | Veredicto: {verdict}")
    if description:
        print(f"       -> Detalle: {description}")

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

def generate_expired_token(user_id="FA92DB7E-ADD3-F111-ADDC-28F10E2CBF39", email="test@mira.dev", role="CLIENT"):
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": "Usuario Expirado",
        "role": role,
        "exp": datetime.now(timezone.utc) - timedelta(hours=2)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def main():
    print("======================================================================")
    print(" MIRA — Fase 18B: Suite de Verificación de Seguridad y Regresión IDOR")
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
        print(f"[OK] Aislamiento garantizado: Servidor {srv_name}, Edición {edition}, BD: {dbname}\n")
    except Exception as e:
        print(f"[ERROR CRITICO] Falló verificación de aislamiento: {e}")
        sys.exit(1)

    # Usuarios para pruebas
    cur.execute("SELECT UserId, Email FROM mira.Users WHERE Email IN ('admin.test@mira-local.dev','operador.test@mira-local.dev','cliente.verificado@mira-local.dev','cliente.pendiente@mira-local.dev')")
    users_dict = {row.Email: str(row.UserId) for row in cur.fetchall()}

    # Identificar recursos de prueba
    # 1. Solicitud no asignada (Folio MIRA-2026-000018 o MIRA-2026-000001)
    cur.execute("SELECT RequestId, Folio, Status FROM mira.Requests WHERE AssignedOperatorId IS NULL AND ClientUserId IS NULL")
    unassigned_req = cur.fetchone()
    if not unassigned_req:
        cur.execute("SELECT RequestId, Folio, Status FROM mira.Requests WHERE AssignedOperatorId IS NULL")
        unassigned_req = cur.fetchone()

    # 2. Solicitud asignada a Operador A (operador.test)
    cur.execute("""
        SELECT r.RequestId, r.Folio, r.Status, r.ClientUserId, r.AssignedOperatorId 
        FROM mira.Requests r
        WHERE r.AssignedOperatorId = ?
    """, users_dict["operador.test@mira-local.dev"])
    assigned_active_req = cur.fetchone()

    # 3. Solicitud propia de Cliente A (cliente.verificado)
    cur.execute("""
        SELECT r.RequestId, r.Folio, r.Status, r.ClientUserId, r.AssignedOperatorId 
        FROM mira.Requests r
        WHERE r.ClientUserId = ?
    """, users_dict["cliente.verificado@mira-local.dev"])
    client_a_own_req = cur.fetchone()

    # 4. Solicitud con estatus Terminada (T)
    cur.execute("SELECT RequestId, Folio, Status, AssignedOperatorId FROM mira.Requests WHERE Status = 'T' AND AssignedOperatorId IS NOT NULL")
    terminated_req = cur.fetchone()

    cn.close()

    rid_unassigned = str(unassigned_req.RequestId)
    initial_unassigned_status = unassigned_req.Status
    rid_assigned = str(assigned_active_req.RequestId)
    initial_assigned_status = assigned_active_req.Status
    rid_client_a = str(client_a_own_req.RequestId)
    rid_terminated = str(terminated_req.RequestId) if terminated_req else None

    print(f"Recursos de prueba identificados:")
    print(f" - Solicitud no asignada (Target IDOR 1): {rid_unassigned} (Folio: {unassigned_req.Folio}, Status: {initial_unassigned_status})")
    print(f" - Solicitud asignada a Operador A (Target IDOR 2): {rid_assigned} (Folio: {assigned_active_req.Folio}, Status: {initial_assigned_status})")
    print(f" - Solicitud propia de Cliente A (Target Propio): {rid_client_a} (Folio: {client_a_own_req.Folio}, Status: {client_a_own_req.Status})")
    if rid_terminated:
        print(f" - Solicitud terminada/cerrada (Target Concluido): {rid_terminated} (Folio: {terminated_req.Folio}, Status: {terminated_req.Status})")
    print()

    # ------------------------------------------------------------------
    # Obtener tokens JWT para cada rol
    # ------------------------------------------------------------------
    _, admin_login = http_req("auth/login", method="POST", payload={"email": "admin.test@mira-local.dev", "password": "TestDev2026!"})
    admin_token = admin_login.get("token")

    _, op_login = http_req("auth/login", method="POST", payload={"email": "operador.test@mira-local.dev", "password": "TestDev2026!"})
    op_token = op_login.get("token")

    _, client_a_login = http_req("auth/login", method="POST", payload={"email": "cliente.verificado@mira-local.dev", "password": "TestDev2026!"})
    client_a_token = client_a_login.get("token")

    _, client_b_login = http_req("auth/login", method="POST", payload={"email": "cliente.pendiente@mira-local.dev", "password": "TestDev2026!"})
    client_b_token = client_b_login.get("token")

    assert admin_token and op_token and client_a_token and client_b_token, "No se pudieron obtener todos los tokens de prueba"
    print("[OK] Tokens JWT emitidos y validados para ADMIN, OPERATOR A, CLIENT A y CLIENT B.\n")

    print("----------------------------------------------------------------------")
    print(" BLOQUE 1: LOS 10 ESCENARIOS IDOR DE REGRESIÓN DE LA FASE 18A")
    print("----------------------------------------------------------------------")

    # ==================================================================
    # 1. Operador A modificando solicitud no asignada (IDOR en Status)
    # ==================================================================
    st, resp = http_req(f"requests/{rid_unassigned}/status", method="PATCH",
                        payload={"status": "A", "comment": "IDOR: Operador A modifica solicitud sin asignación"},
                        token=op_token)
    record("SEC-01", "Operador A modifica estatus de solicitud no asignada",
           current_code=st, expected_code=403, category="REGRESSION_IDOR",
           description=f"Respuesta backend: {resp.get('error', resp)}")

    # ==================================================================
    # 2. Operador A agregando notas a solicitud no asignada (IDOR en WorkNotes POST)
    # ==================================================================
    st, resp = http_req(f"requests/{rid_unassigned}/notes", method="POST",
                        payload={"note": "IDOR: Operador A inyecta avance técnico en solicitud sin asignación"},
                        token=op_token)
    record("SEC-02", "Operador A registra nota en solicitud no asignada",
           current_code=st, expected_code=403, category="REGRESSION_IDOR",
           description=f"Respuesta backend: {resp.get('error', resp)}")

    # ==================================================================
    # 3. Cliente B leyendo notas técnicas de solicitud de Cliente A (IDOR en WorkNotes GET)
    # ==================================================================
    st, resp = http_req(f"requests/{rid_client_a}/notes", method="GET", token=client_b_token)
    record("SEC-03", "Cliente B lee notas técnicas de solicitud de Cliente A",
           current_code=st, expected_code=403, category="REGRESSION_IDOR",
           description=f"Respuesta backend: {resp.get('error', resp)}")

    # ==================================================================
    # 4. Cliente B intentando modificar estatus de solicitud de Cliente A (RBAC Check)
    # ==================================================================
    st, resp = http_req(f"requests/{rid_client_a}/status", method="PATCH",
                        payload={"status": "T", "comment": "Cliente B intentando concluir solicitud de Cliente A"},
                        token=client_b_token)
    record("SEC-04", "Cliente B intenta modificar estatus de solicitud ajena",
           current_code=st, expected_code=403, category="REGRESSION_IDOR",
           description=f"Respuesta backend: {resp.get('error', resp)}")

    # ==================================================================
    # 5. Operador A consultando notas de solicitud no asignada (IDOR Notes Scope)
    # ==================================================================
    st, resp = http_req(f"requests/{rid_unassigned}/notes", method="GET", token=op_token)
    record("SEC-05", "Operador A consulta notas de solicitud no asignada a él",
           current_code=st, expected_code=403, category="REGRESSION_IDOR",
           description=f"Respuesta backend: {resp.get('error', resp)}")

    # ==================================================================
    # 6. Administrador ejecutando operaciones de supervisión autorizadas
    # ==================================================================
    st_assign, _ = http_req(f"requests/{rid_unassigned}/assign", method="PATCH",
                            payload={"operatorId": users_dict["operador.test@mira-local.dev"]},
                            token=admin_token)
    st_note, _ = http_req(f"requests/{rid_unassigned}/notes", method="POST",
                          payload={"note": "Supervisión ADMIN: Operador asignado y caso auditado."},
                          token=admin_token)
    st_read, notes_list = http_req(f"requests/{rid_unassigned}/notes", method="GET", token=admin_token)
    st_status, _ = http_req(f"requests/{rid_unassigned}/status", method="PATCH",
                            payload={"status": "A", "comment": "Supervisión ADMIN: Marcado como Atendida"},
                            token=admin_token)
    admin_success = (st_assign == 200 and st_note == 201 and st_read == 200 and st_status == 200)
    record("SEC-06", "Administrador ejecuta operaciones de supervisión autorizadas",
           current_code=200 if admin_success else 500, expected_code=200, category="REGRESSION_IDOR",
           description=f"Assign: {st_assign}, PostNote: {st_note}, GetNotes: {st_read}, PatchStatus: {st_status}")

    # ==================================================================
    # 7. Intentos no autorizados con token ausente, corrupto o expirado
    # ==================================================================
    expired_token = generate_expired_token()
    st_no_tok, _ = http_req(f"requests/{rid_assigned}/notes", method="GET", token=None)
    st_corrupt, _ = http_req(f"requests/{rid_assigned}/notes", method="GET", token="eyInvalid.Corrupt.TokenSignature")
    st_exp, _ = http_req(f"requests/{rid_assigned}/notes", method="GET", token=expired_token)
    st_status_no_tok, _ = http_req(f"requests/{rid_assigned}/status", method="PATCH", payload={"status": "T"}, token=None)

    unauth_correct = (st_no_tok == 401 and st_corrupt == 401 and st_exp == 401 and st_status_no_tok == 401)
    record("SEC-07", "Rechazo de solicitudes con token ausente, corrupto o expirado",
           current_code=401 if unauth_correct else 200, expected_code=401, category="REGRESSION_IDOR",
           description=f"Sin token: {st_no_tok}, Corrupto: {st_corrupt}, Expirado: {st_exp}, PatchStatus sin token: {st_status_no_tok}")

    # ==================================================================
    # 8. Intentos sobre request_id inexistente (404 controlado vs Error 500)
    # ==================================================================
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    st_fake_status, _ = http_req(f"requests/{fake_uuid}/status", method="PATCH",
                                 payload={"status": "A", "comment": "ID fantasma"},
                                 token=op_token)
    st_fake_post_note, _ = http_req(f"requests/{fake_uuid}/notes", method="POST",
                                    payload={"note": "Nota para solicitud inexistente"},
                                    token=op_token)
    st_fake_get_note, _ = http_req(f"requests/{fake_uuid}/notes", method="GET",
                                   token=op_token)

    record("SEC-08A", "Manejo de request_id inexistente en PATCH status",
           current_code=st_fake_status, expected_code=404, category="REGRESSION_IDOR",
           description="Respuesta controlada HTTP 404 Not Found (sin AttributeError no controlado)")

    record("SEC-08B", "Manejo de request_id inexistente en POST notes",
           current_code=st_fake_post_note, expected_code=404, category="REGRESSION_IDOR",
           description="Respuesta controlada HTTP 404 Not Found (sin IntegrityError de FK no controlado)")

    record("SEC-08C", "Manejo de request_id inexistente en GET notes",
           current_code=st_fake_get_note, expected_code=404, category="REGRESSION_IDOR",
           description="Respuesta controlada HTTP 404 Not Found (sin falsos positivos de lista vacía)")

    print("\n----------------------------------------------------------------------")
    print(" BLOQUE 2: PRUEBAS FUNCIONALES ADICIONALES Y CASOS POSITIVOS (FASE 18B)")
    print("----------------------------------------------------------------------")

    # ==================================================================
    # 9. Operador autorizado consultando notas de su solicitud asignada
    # ==================================================================
    st_op_read, notes_op = http_req(f"requests/{rid_assigned}/notes", method="GET", token=op_token)
    record("POS-01", "Operador autorizado consulta notas de solicitud asignada",
           current_code=st_op_read, expected_code=200, category="FUNCTIONAL_POSITIVE",
           description=f"Operador recuperó {len(notes_op) if isinstance(notes_op, list) else 0} notas de su caso asignado.")

    # ==================================================================
    # 10. Operador autorizado agregando nota en su solicitud asignada
    # ==================================================================
    st_op_write, _ = http_req(f"requests/{rid_assigned}/notes", method="POST",
                              payload={"note": f"Avance autorizado del especialista a las {time.strftime('%H:%M:%S')}"},
                              token=op_token)
    record("POS-02", "Operador autorizado registra avance en solicitud asignada",
           current_code=st_op_write, expected_code=201, category="FUNCTIONAL_POSITIVE",
           description="Avance técnico insertado exitosamente en mira.WorkNotes")

    # ==================================================================
    # 11. Operador autorizado concluyendo exitosamente el servicio ('A' -> 'T')
    # ==================================================================
    cn = pyodbc.connect(DB_CONN)
    cur = cn.cursor()
    cur.execute("UPDATE mira.Requests SET Status = 'A', UpdatedAt = SYSUTCDATETIME() WHERE RequestId = ?", rid_assigned)
    cn.commit()
    cn.close()

    st_op_finish, finish_resp = http_req(f"requests/{rid_assigned}/status", method="PATCH",
                                         payload={"status": "T", "comment": "Servicio concluido formalmente por especialista"},
                                         token=op_token)
    record("POS-03", "Operador autorizado concluye solicitud asignada ('A' -> 'T')",
           current_code=st_op_finish, expected_code=200, category="FUNCTIONAL_POSITIVE",
           description=f"Estatus actualizado a: {finish_resp.get('status')} ({finish_resp.get('label')})")

    # ==================================================================
    # 12. Cliente consultando notas de solicitud propia (ClientUserId == claim.sub)
    # ==================================================================
    st_client_read, client_notes = http_req(f"requests/{rid_client_a}/notes", method="GET", token=client_a_token)
    record("POS-04", "Cliente propietario consulta notas de su propia solicitud",
           current_code=st_client_read, expected_code=200, category="FUNCTIONAL_POSITIVE",
           description=f"Cliente A recuperó {len(client_notes) if isinstance(client_notes, list) else 0} notas de su servicio.")

    # ==================================================================
    # 13. Operador intentando modificar una solicitud ya Terminada (T)
    # ==================================================================
    st_op_reopen, reopen_resp = http_req(f"requests/{rid_assigned}/status", method="PATCH",
                                         payload={"status": "A", "comment": "Intento de reabrir solicitud concluida"},
                                         token=op_token)
    record("POS-05", "Operador intenta modificar solicitud ya concluida ('T')",
           current_code=st_op_reopen, expected_code=400, category="FUNCTIONAL_BOUNDARY",
           description=f"Transición bloqueada: {reopen_resp.get('error')}")

    # ==================================================================
    # 14. Operador intentando registrar una nota vacía o sólo con espacios
    # ==================================================================
    st_empty_note, empty_resp = http_req(f"requests/{rid_assigned}/notes", method="POST",
                                         payload={"note": "    "},
                                         token=op_token)
    record("POS-06", "Operador intenta registrar nota técnica vacía o con espacios",
           current_code=st_empty_note, expected_code=400, category="FUNCTIONAL_BOUNDARY",
           description=f"Validación de contenido: {empty_resp.get('error')}")

    # ==================================================================
    # 15. Identificador de solicitud malformado (UUID no válido)
    # ==================================================================
    st_malformed, malformed_resp = http_req("requests/no-es-un-uuid-valido/notes", method="GET", token=op_token)
    record("POS-07", "Petición con UUID malformado retorna 404 (evita error SQL)",
           current_code=st_malformed, expected_code=404, category="FUNCTIONAL_BOUNDARY",
           description=f"Respuesta controlada: {malformed_resp.get('error')}")

    # ==================================================================
    # 16. Cliente intentando registrar nota en bitácora técnica
    # ==================================================================
    st_client_write, client_write_resp = http_req(f"requests/{rid_assigned}/notes", method="POST",
                                                  payload={"note": "Cliente intentando escribir nota técnica"},
                                                  token=client_a_token)
    record("POS-08", "Cliente intenta registrar nota en bitácora técnica (Bloqueado)",
           current_code=st_client_write, expected_code=403, category="FUNCTIONAL_BOUNDARY",
           description=f"Restricción de rol CLIENT: {client_write_resp.get('error')}")

    # ------------------------------------------------------------------
    # Limpieza idempotente en BD local (restaurar estado original)
    # ------------------------------------------------------------------
    try:
        cn = pyodbc.connect(DB_CONN)
        cur = cn.cursor()
        cur.execute("UPDATE mira.Requests SET Status = ?, AssignedOperatorId = NULL, UpdatedAt = SYSUTCDATETIME() WHERE RequestId = ?", initial_unassigned_status, rid_unassigned)
        cur.execute("UPDATE mira.Requests SET Status = ?, UpdatedAt = SYSUTCDATETIME() WHERE RequestId = ?", initial_assigned_status, rid_assigned)
        cur.execute("DELETE FROM mira.WorkNotes WHERE Note LIKE 'IDOR:%' OR Note LIKE 'Supervisión ADMIN:%' OR Note LIKE 'Avance autorizado%'")
        cur.execute("DELETE FROM mira.StatusHistory WHERE Comment LIKE 'IDOR:%' OR Comment LIKE 'Supervisión ADMIN:%' OR Comment LIKE 'Servicio concluido formalmente%'")
        cn.commit()
        cn.close()
        print("\n[OK] Limpieza de prueba ejecutada con éxito (mira_dev restaurado).")
    except Exception as ex:
        print(f"[ALERTA] Error al limpiar registros temporales de prueba: {ex}")

    # ------------------------------------------------------------------
    # Resumen Ejecutivo
    # ------------------------------------------------------------------
    print("\n======================================================================")
    print(" RESUMEN DE LA SUITE DE REGRESIÓN DE SEGURIDAD (FASE 18B)")
    print("======================================================================")
    total_tests = len(results)
    pass_count = sum(1 for r in results if r["success"])
    fail_count = total_tests - pass_count

    print(f"Total de casos ejecutados: {total_tests}")
    print(f"Casos aprobados exitosamente (PASS): {pass_count}")
    print(f"Casos fallidos (FAIL): {fail_count}")
    print("----------------------------------------------------------------------")
    print(f"{'ID':<10} | {'Nombre de Prueba':<50} | {'Act.':<4} | {'Esp.':<4} | {'Veredicto'}")
    print("----------------------------------------------------------------------")
    for r in results:
        print(f"{r['id']:<10} | {r['name'][:50]:<50} | {r['current_code']:<4} | {r['expected_code']:<4} | {r['verdict']}")
    print("======================================================================\n")

    if fail_count > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
