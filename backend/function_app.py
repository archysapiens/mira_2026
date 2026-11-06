import azure.functions as func
import hashlib
import json
import jwt
import os
import pyodbc
import secrets
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

# ==============================================================================
# CONFIGURACIÓN CRIPTOGRÁFICA (OWASP Argon2id)
# ==============================================================================
ARGON2_TIME_COST = 2
ARGON2_MEMORY_COST = 65536  # 64 MB
ARGON2_PARALLELISM = 2
ARGON2_HASH_LEN = 32
ARGON2_SALT_LEN = 16

password_hasher = PasswordHasher(
    time_cost=ARGON2_TIME_COST,
    memory_cost=ARGON2_MEMORY_COST,
    parallelism=ARGON2_PARALLELISM,
    hash_len=ARGON2_HASH_LEN,
    salt_len=ARGON2_SALT_LEN
)

def hash_password_argon2(plain_password: str) -> str:
    return password_hasher.hash(plain_password)

def is_legacy_sha256(stored_hash: str) -> bool:
    if not stored_hash or stored_hash.startswith("$argon2"):
        return False
    clean = stored_hash.strip().upper()
    return len(clean) == 64 and all(c in "0123456789ABCDEF" for c in clean)

def verify_password_argon2(stored_hash: str, plain_password: str) -> bool:
    try:
        return password_hasher.verify(stored_hash, plain_password)
    except (VerifyMismatchError, InvalidHashError, Exception):
        return False

def verify_legacy_sha256(stored_hash: str, plain_password: str) -> bool:
    candidate = hashlib.sha256(plain_password.encode("utf-8")).hexdigest().upper()
    return secrets.compare_digest(stored_hash.strip().upper(), candidate)

def check_needs_rehash(stored_hash: str) -> bool:
    try:
        return password_hasher.check_needs_rehash(stored_hash)
    except Exception:
        return True

# ==============================================================================
# LIMITADOR DE PETICIONES (RATE LIMITER EN MEMORIA POR INSTANCIA)
# ==============================================================================
class SlidingWindowRateLimiter:
    """
    Limitador en memoria con ventana deslizante por clave (IP, cuenta o acción).
    Funciona como capa de contención local dentro de cada proceso trabajador de Azure Functions.
    Para producción distribuida se complementa con Azure API Management / Azure Front Door.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._records = {}

    def check_and_record(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        with self._lock:
            timestamps = self._records.get(key, [])
            cutoff = now - window_seconds
            timestamps = [t for t in timestamps if t > cutoff]

            if len(timestamps) >= max_requests:
                oldest = timestamps[0]
                retry_after = max(1, int(window_seconds - (now - oldest)))
                self._records[key] = timestamps
                return False, retry_after

            timestamps.append(now)
            self._records[key] = timestamps
            return True, 0

    def reset(self, key: str = None):
        with self._lock:
            if key:
                self._records.pop(key, None)
            else:
                self._records.clear()

rate_limiter = SlidingWindowRateLimiter()

def get_header(req, header_name: str) -> str:
    if not req or not hasattr(req, "headers"):
        return ""
    target = header_name.lower()
    for k, v in req.headers.items():
        if k.lower() == target:
            return v
    return ""

def get_client_ip(req) -> str:
    xff = get_header(req, "x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return get_header(req, "x-real-ip") or "127.0.0.1"

def rate_limit_check(action: str, req, identifier: str = None) -> tuple[bool, int]:
    if os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("false", "0", "no"):
        return True, 0

    env_mode = os.getenv("MIRA_ENV", os.getenv("AZURE_FUNCTIONS_ENVIRONMENT", "production")).lower()
    is_dev = (env_mode == "development")

    # Límites específicos por acción/cuenta
    defaults = {
        "login": (5, 60),
        "register": (5, 60),
        "otp_request": (5, 60),
        "otp_verify": (5, 60),
    }
    default_max, default_win = defaults.get(action, (5, 60))

    max_req = int(os.getenv(f"RATE_LIMIT_{action.upper()}_MAX", str(default_max)))
    win_sec = int(os.getenv(f"RATE_LIMIT_{action.upper()}_WINDOW", str(default_win)))

    # Techo general por IP (permite que múltiples usuarios compartan la misma IP local/corporativa)
    ip_max = int(os.getenv("RATE_LIMIT_IP_MAX", "60"))
    ip_win = int(os.getenv("RATE_LIMIT_IP_WINDOW", "60"))

    # En modo desarrollo únicamente, soportar encabezados para pruebas automatizadas rápidas
    if is_dev:
        hdr_max = get_header(req, "x-test-rate-limit-max")
        hdr_win = get_header(req, "x-test-rate-limit-window")
        if hdr_max and hdr_max.isdigit():
            max_req = int(hdr_max)
            ip_max = int(hdr_max)
        if hdr_win and hdr_win.isdigit():
            win_sec = int(hdr_win)
            ip_win = int(hdr_win)

    ip = get_client_ip(req)
    # 1. Comprobación de límite por IP
    allowed_ip, retry_ip = rate_limiter.check_and_record(f"ip:{ip}", ip_max, ip_win)
    if not allowed_ip:
        return False, retry_ip

    # 2. Comprobación de límite por cuenta / identificador específico
    if identifier:
        clean_id = identifier.strip().lower()
        allowed_id, retry_id = rate_limiter.check_and_record(f"{action}:id:{clean_id}", max_req, win_sec)
        if not allowed_id:
            return False, retry_id
    else:
        allowed_act, retry_act = rate_limiter.check_and_record(f"{action}:act:{ip}", max_req, win_sec)
        if not allowed_act:
            return False, retry_act

    return True, 0

# ==============================================================================
# APLICACIÓN AZURE FUNCTIONS Y UTILIDADES BASE
# ==============================================================================
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
STATUS = {"E": "Enviada", "A": "Atendida", "C": "Cancelada", "T": "Terminada"}

def conn():
    return pyodbc.connect(os.environ["SQL_CONNECTION_STRING"])

def get_allowed_origins() -> list[str]:
    env_mode = os.getenv("MIRA_ENV", os.getenv("AZURE_FUNCTIONS_ENVIRONMENT", "production")).lower()
    raw_allowed = os.getenv("ALLOWED_ORIGIN", "").strip()
    if env_mode == "production":
        return [o.strip() for o in raw_allowed.split(",") if o.strip()]
    dev_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ]
    if raw_allowed:
        for o in raw_allowed.split(","):
            clean_o = o.strip()
            if clean_o and clean_o not in dev_origins:
                dev_origins.append(clean_o)
    return dev_origins

def get_cors_headers(req=None):
    """
    Genera encabezados CORS seguros.
    En producción: requiere configuración explícita en ALLOWED_ORIGIN (no comodín '*').
    En desarrollo: permite orígenes locales de Vite (5173, 3000) y LiveServer (5500).
    """
    env_mode = os.getenv("MIRA_ENV", os.getenv("AZURE_FUNCTIONS_ENVIRONMENT", "production")).lower()
    allowed_list = get_allowed_origins()

    headers = {
        "Access-Control-Allow-Headers": "authorization,content-type,x-csrf-token,x-test-rate-limit-max,x-test-rate-limit-window,x-test-cooldown",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin"
    }

    if req:
        origin = get_header(req, "origin")
        if origin:
            if origin in allowed_list:
                headers["Access-Control-Allow-Origin"] = origin
            # Si el origen no está autorizado, NO se agrega Access-Control-Allow-Origin
    elif allowed_list and env_mode != "production":
        headers["Access-Control-Allow-Origin"] = allowed_list[0]

    return headers

def response(data, status=200, headers=None, cookies=None, req=None):
    resp_headers = get_cors_headers(req)
    if headers:
        resp_headers.update(headers)
    resp = func.HttpResponse(
        json.dumps(data, default=str, ensure_ascii=False),
        status_code=status,
        mimetype="application/json",
        headers=resp_headers
    )
    if cookies:
        for c in cookies:
            resp.headers.add_header("Set-Cookie", c)
    return resp

def options(req):
    if req.method == "OPTIONS":
        origin = get_header(req, "origin")
        cors_hdrs = get_cors_headers(req)
        if origin and "Access-Control-Allow-Origin" not in cors_hdrs:
            return func.HttpResponse(
                json.dumps({"error": "Origen no permitido por política CORS"}),
                status_code=403,
                mimetype="application/json"
            )
        return func.HttpResponse("{}", status_code=200, mimetype="application/json", headers=cors_hdrs)
    return None

def rate_limited_response(retry_after: int, req=None):
    return response(
        {
            "error": "Demasiadas peticiones. Por favor espera antes de intentar nuevamente.",
            "retryAfter": retry_after
        },
        status=429,
        headers={"Retry-After": str(retry_after)},
        req=req
    )

def body(req):
    try:
        return req.get_json()
    except Exception:
        return {}

def is_secure_context(req) -> bool:
    env_mode = os.getenv("MIRA_ENV", os.getenv("AZURE_FUNCTIONS_ENVIRONMENT", "production")).lower()
    if env_mode == "production":
        return True
    proto = get_header(req, "x-forwarded-proto").lower()
    if proto == "https":
        return True
    url = getattr(req, "url", "")
    if url.lower().startswith("https://"):
        return True
    return False

def get_cookies(req) -> dict[str, str]:
    raw_cookie = get_header(req, "cookie")
    if not raw_cookie:
        return {}
    cookies = {}
    for part in raw_cookie.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            cookies[k.strip()] = v.strip()
    return cookies

def make_session_cookie_headers(session_jwt: str, refresh_token: str, csrf_token: str, is_secure: bool) -> list[str]:
    sec_flag = "; Secure" if is_secure else ""
    return [
        f"mira_session={session_jwt}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=900{sec_flag}",
        f"mira_refresh={refresh_token}; Path=/api/auth; HttpOnly; SameSite=Strict; Max-Age=604800{sec_flag}",
        f"mira_csrf={csrf_token}; Path=/; SameSite=Strict; Max-Age=604800{sec_flag}",
    ]

def make_delete_cookie_headers(is_secure: bool) -> list[str]:
    sec_flag = "; Secure" if is_secure else ""
    return [
        f"mira_session=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT{sec_flag}",
        f"mira_refresh=; Path=/api/auth; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT{sec_flag}",
        f"mira_csrf=; Path=/; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT{sec_flag}",
    ]

def check_csrf(req, claims=None) -> tuple[bool, str]:
    if req.method.upper() not in ("POST", "PATCH", "PUT", "DELETE"):
        return True, ""

    allowed_list = get_allowed_origins()

    # 1. Comprobación de Origin
    origin = get_header(req, "origin")
    if origin:
        if allowed_list and origin not in allowed_list:
            return False, "CSRF: Origen no permitido por la política del servidor"
    else:
        referer = get_header(req, "referer")
        if referer:
            try:
                from urllib.parse import urlparse
                ref_parts = urlparse(referer)
                ref_origin = f"{ref_parts.scheme}://{ref_parts.netloc}"
                if allowed_list and ref_origin not in allowed_list:
                    return False, "CSRF: Referer no permitido por la política del servidor"
            except Exception:
                return False, "CSRF: Referer inválido"

    # 2. Comprobación de Fetch Metadata
    sec_fetch_site = get_header(req, "sec-fetch-site").lower()
    if sec_fetch_site == "cross-site":
        return False, "CSRF: Petición cross-site rechazada"

    # 3. Comprobación de token CSRF para sesiones con cookies
    cookies = get_cookies(req)
    has_cookie = bool(cookies.get("mira_session") or cookies.get("mira_refresh"))
    is_cookie_auth = bool((claims and claims.get("_is_cookie")) or has_cookie)

    if is_cookie_auth:
        csrf_header = get_header(req, "x-csrf-token")
        csrf_cookie = cookies.get("mira_csrf")
        if not csrf_header or not csrf_cookie:
            return False, "CSRF: Token anti-CSRF requerido para sesiones autenticadas con cookies"
        if csrf_header != csrf_cookie:
            return False, "CSRF: Token anti-CSRF discrepante"
        if claims and claims.get("csrf_hash"):
            computed = hashlib.sha256(csrf_header.encode()).hexdigest()
            if computed != claims["csrf_hash"]:
                return False, "CSRF: Token anti-CSRF no vinculado a la sesión activa"

    return True, ""

def token_for(row, session_id=None):
    payload = {
        "sub": str(row.UserId),
        "email": row.Email,
        "name": row.FullName,
        "role": row.RoleCode,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8)
    }
    if session_id:
        payload["sid"] = str(session_id)
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")

def auth(req, roles=None):
    try:
        token = None
        is_cookie_session = False
        auth_hdr = get_header(req, "authorization")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()
        else:
            cookies = get_cookies(req)
            token = cookies.get("mira_session")
            if token:
                is_cookie_session = True

        if not token:
            return None

        claims = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])

        # Validar estado en mira.UserSessions si tiene 'sid'
        sid = claims.get("sid")
        if sid:
            try:
                with conn() as cn:
                    cur = cn.cursor()
                    cur.execute("""
                        SELECT SessionId, UserId, IsRevoked, ExpiresAt, IdleExpiresAt, CsrfTokenHash
                        FROM mira.UserSessions
                        WHERE SessionId = ?
                    """, sid)
                    sess = cur.fetchone()
                    if not sess or sess.IsRevoked:
                        return None

                    cur.execute("SELECT SYSUTCDATETIME()")
                    now_utc = cur.fetchone()[0]
                    if sess.ExpiresAt <= now_utc or sess.IdleExpiresAt <= now_utc:
                        return None

                    cur.execute("""
                        UPDATE mira.UserSessions
                        SET LastActivityAt = SYSUTCDATETIME(),
                            IdleExpiresAt = DATEADD(HOUR, 4, SYSUTCDATETIME())
                        WHERE SessionId = ?
                    """, sid)
                    cn.commit()
                    claims["csrf_hash"] = sess.CsrfTokenHash
            except Exception:
                pass

        if roles and claims.get("role") not in roles:
            return None

        claims["_is_cookie"] = is_cookie_session
        return claims
    except Exception:
        return None

def rows(cursor):
    cols = [x[0] for x in cursor.description]
    return [dict(zip(cols, r)) for r in cursor.fetchall()]

def claim_requests_for_user(cur, user_id, email):
    clean_email = email.lower().strip()
    cur.execute("SELECT RequestId, Folio FROM mira.Requests WHERE ClientUserId IS NULL AND LOWER(LTRIM(RTRIM(Email)))=LOWER(LTRIM(RTRIM(?)))", clean_email)
    unclaimed = cur.fetchall()
    if not unclaimed:
        return []
    cur.execute("UPDATE mira.Requests SET ClientUserId=?, UpdatedAt=SYSUTCDATETIME() WHERE ClientUserId IS NULL AND LOWER(LTRIM(RTRIM(Email)))=LOWER(LTRIM(RTRIM(?)))", user_id, clean_email)
    for r in unclaimed:
        try:
            cur.execute("INSERT mira.RequestActivities(RequestId,UserId,ActivityType,Description,IsVisibleToClient) VALUES(?,?,'REQUEST_CLAIMED','Solicitud pública vinculada a la cuenta del cliente.',1)", r.RequestId, user_id)
        except Exception:
            try:
                cur.execute("INSERT mira.StatusHistory(RequestId,NewStatus,Comment,ChangedByUserId) VALUES(?,'E','Solicitud pública vinculada al cliente',?)", r.RequestId, user_id)
            except Exception:
                pass
    return [r.Folio for r in unclaimed]

def check_007_schema(cur):
    try:
        cur.execute("SELECT COL_LENGTH('mira.Users', 'EmailVerified'), OBJECT_ID('mira.EmailVerificationTokens', 'U')")
        row = cur.fetchone()
        return bool(row and row[0] is not None and row[1] is not None)
    except Exception:
        return False

# ==============================================================================
# RUTAS DE LA API
# ==============================================================================

@app.route(route="health", methods=["GET"])
def health(req):
    return response({"service": "mira-api", "status": "ok", "utc": datetime.now(timezone.utc)}, req=req)

@app.route(route="auth/login", methods=["POST", "OPTIONS"])
def login(req):
    if (x := options(req)):
        return x

    data = body(req)
    email = (data.get("email") or "").strip().lower()
    plain_password = str(data.get("password") or "")

    # Limitación de peticiones por IP y cuenta
    allowed, retry_after = rate_limit_check("login", req, identifier=email or None)
    if not allowed:
        return rate_limited_response(retry_after, req=req)

    # Protección contra enumeración y validación genérica de credenciales
    if not email or not plain_password:
        return response({"error": "Credenciales incorrectas"}, 401, req=req)

    with conn() as cn:
        cur = cn.cursor()
        cur.execute("SELECT COL_LENGTH('mira.Users', 'EmailVerified')")
        has_col = cur.fetchone()[0] is not None
        sql = f"""
            SELECT u.UserId, u.Email, u.PasswordHash, u.FullName, u.IsActive, r.Code RoleCode,
                   {'ISNULL(u.EmailVerified, 0)' if has_col else '0'} AS EmailVerified
            FROM mira.Users u
            JOIN mira.Roles r ON r.RoleId=u.RoleId
            WHERE LOWER(u.Email)=LOWER(?) AND u.IsActive=1
        """
        row = cur.execute(sql, email).fetchone()
        if not row:
            # Ejecutar verificación ficticia de Argon2id para mitigar ataques de temporización
            verify_password_argon2("$argon2id$v=19$m=65536,t=2,p=2$c29tZXNhbHQ$RdescudvJCsgqlndPvcfbTl9xDnvbXR4HtBRJy2b4ic", "dummy")
            return response({"error": "Credenciales incorrectas"}, 401, req=req)

        stored_hash = str(row.PasswordHash or "")
        is_authenticated = False
        needs_migration_or_rehash = False

        if is_legacy_sha256(stored_hash):
            if verify_legacy_sha256(stored_hash, plain_password):
                is_authenticated = True
                needs_migration_or_rehash = True
        elif stored_hash.startswith("$argon2"):
            if verify_password_argon2(stored_hash, plain_password):
                is_authenticated = True
                if check_needs_rehash(stored_hash):
                    needs_migration_or_rehash = True
        else:
            is_authenticated = False

        if not is_authenticated:
            return response({"error": "Credenciales incorrectas"}, 401, req=req)

        if needs_migration_or_rehash:
            new_argon2_hash = hash_password_argon2(plain_password)
            cur.execute("""
                UPDATE mira.Users 
                SET PasswordHash = ?, UpdatedAt = SYSUTCDATETIME() 
                WHERE UserId = ? AND PasswordHash = ?
            """, new_argon2_hash, row.UserId, stored_hash)
            cn.commit()

        is_verified = (int(getattr(row, "EmailVerified", 0) or 0) == 1)
        if row.RoleCode == "CLIENT" and is_verified:
            claim_requests_for_user(cur, row.UserId, row.Email)
            cn.commit()

        session_id = uuid.uuid4()
        refresh_token = secrets.token_hex(32)
        csrf_token = secrets.token_hex(32)
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        csrf_hash = hashlib.sha256(csrf_token.encode()).hexdigest()
        ip = get_client_ip(req)
        ua = (get_header(req, "user-agent") or "")[:255]

        try:
            cur.execute("""
                INSERT INTO mira.UserSessions (
                    SessionId, UserId, RefreshTokenHash, CsrfTokenHash, UserAgent, IpAddress,
                    CreatedAt, LastActivityAt, ExpiresAt, IdleExpiresAt, IsRevoked
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    SYSUTCDATETIME(), SYSUTCDATETIME(),
                    DATEADD(DAY, 7, SYSUTCDATETIME()), DATEADD(HOUR, 4, SYSUTCDATETIME()), 0
                )
            """, session_id, row.UserId, refresh_hash, csrf_hash, ua, ip)
            cn.commit()
            jwt_token = token_for(row, session_id=session_id)
        except Exception:
            jwt_token = token_for(row)

        is_sec = is_secure_context(req)
        cookies = make_session_cookie_headers(jwt_token, refresh_token, csrf_token, is_sec)

        return response(
            {
                "token": jwt_token,
                "user": {
                    "id": str(row.UserId),
                    "email": row.Email,
                    "name": row.FullName,
                    "role": row.RoleCode,
                    "emailVerified": is_verified
                },
                "csrfToken": csrf_token
            },
            cookies=cookies,
            req=req
        )

@app.route(route="auth/me", methods=["GET", "OPTIONS"])
def auth_me(req):
    if (x := options(req)):
        return x

    claim = auth(req)
    if not claim:
        return response({"error": "No autenticado o sesión expirada"}, 401, req=req)

    user_id = claim["sub"]
    with conn() as cn:
        cur = cn.cursor()
        cur.execute("SELECT COL_LENGTH('mira.Users', 'EmailVerified')")
        has_col = cur.fetchone()[0] is not None
        sql = f"""
            SELECT u.UserId, u.Email, u.FullName, r.Code AS RoleCode,
                   {'ISNULL(u.EmailVerified, 0)' if has_col else '0'} AS EmailVerified
            FROM mira.Users u
            JOIN mira.Roles r ON r.RoleId = u.RoleId
            WHERE u.UserId = ? AND u.IsActive = 1
        """
        row = cur.execute(sql, user_id).fetchone()
        if not row:
            return response({"error": "Usuario no encontrado o inactivo"}, 401, req=req)

        return response({
            "user": {
                "id": str(row.UserId),
                "email": row.Email,
                "name": row.FullName,
                "role": row.RoleCode,
                "emailVerified": bool(int(row.EmailVerified or 0))
            }
        }, req=req)

@app.route(route="auth/logout", methods=["POST", "OPTIONS"])
def auth_logout(req):
    if (x := options(req)):
        return x

    claim = auth(req)
    ok, err = check_csrf(req, claim)
    if not ok:
        return response({"error": err}, 403, req=req)

    if claim and claim.get("sid"):
        sid = claim["sid"]
        try:
            with conn() as cn:
                cur = cn.cursor()
                cur.execute("""
                    UPDATE mira.UserSessions
                    SET IsRevoked = 1, RevokedAt = SYSUTCDATETIME()
                    WHERE SessionId = ?
                """, sid)
                cn.commit()
        except Exception:
            pass

    is_sec = is_secure_context(req)
    del_cookies = make_delete_cookie_headers(is_sec)
    return response({"message": "Sesión cerrada correctamente"}, cookies=del_cookies, req=req)

@app.route(route="auth/refresh", methods=["POST", "OPTIONS"])
def auth_refresh(req):
    if (x := options(req)):
        return x

    ok, err = check_csrf(req)
    if not ok:
        return response({"error": err}, 403, req=req)

    cookies = get_cookies(req)
    refresh_token = cookies.get("mira_refresh")
    if not refresh_token:
        b = body(req)
        refresh_token = b.get("refreshToken")

    if not refresh_token:
        return response({"error": "Token de actualización no proporcionado"}, 400, req=req)

    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    with conn() as cn:
        cur = cn.cursor()
        cur.execute("""
            SELECT s.SessionId, s.UserId, s.IsRevoked, s.ExpiresAt, s.IdleExpiresAt, s.ReplacedBySessionId,
                   u.Email, u.FullName, r.Code AS RoleCode, ISNULL(u.EmailVerified, 0) AS EmailVerified, u.IsActive
            FROM mira.UserSessions s
            JOIN mira.Users u ON u.UserId = s.UserId
            JOIN mira.Roles r ON r.RoleId = u.RoleId
            WHERE s.RefreshTokenHash = ?
        """, token_hash)
        sess = cur.fetchone()

        if not sess:
            return response({"error": "Token de actualización inválido"}, 401, req=req)

        is_sec = is_secure_context(req)

        # DETECCIÓN DE REUTILIZACIÓN (Reuse Detection): Token ya revocado siendo reutilizado
        if sess.IsRevoked:
            cur.execute("""
                UPDATE mira.UserSessions
                SET IsRevoked = 1, RevokedAt = SYSUTCDATETIME()
                WHERE UserId = ?
            """, sess.UserId)
            cn.commit()
            del_cookies = make_delete_cookie_headers(is_sec)
            return response(
                {"error": "Detección de reutilización de token: se han revocado todas las sesiones por seguridad"},
                status=401,
                cookies=del_cookies,
                req=req
            )

        cur.execute("SELECT SYSUTCDATETIME()")
        now_utc = cur.fetchone()[0]
        if sess.ExpiresAt <= now_utc or sess.IdleExpiresAt <= now_utc or not sess.IsActive:
            cur.execute("UPDATE mira.UserSessions SET IsRevoked = 1, RevokedAt = SYSUTCDATETIME() WHERE SessionId = ?", sess.SessionId)
            cn.commit()
            return response({"error": "Sesión expirada o inactiva"}, 401, req=req)

        new_session_id = uuid.uuid4()
        new_refresh = secrets.token_hex(32)
        new_csrf = secrets.token_hex(32)
        new_refresh_hash = hashlib.sha256(new_refresh.encode()).hexdigest()
        new_csrf_hash = hashlib.sha256(new_csrf.encode()).hexdigest()

        # Invalidar la sesión previa atómicamente
        cur.execute("""
            UPDATE mira.UserSessions
            SET IsRevoked = 1, RevokedAt = SYSUTCDATETIME(), ReplacedBySessionId = ?
            WHERE SessionId = ? AND IsRevoked = 0
        """, new_session_id, sess.SessionId)
        if cur.rowcount != 1:
            cn.rollback()
            return response({"error": "Conflicto de actualización concurrente"}, 409, req=req)

        ip = get_client_ip(req)
        ua = (get_header(req, "user-agent") or "")[:255]
        cur.execute("""
            INSERT INTO mira.UserSessions (
                SessionId, UserId, RefreshTokenHash, CsrfTokenHash, UserAgent, IpAddress,
                CreatedAt, LastActivityAt, ExpiresAt, IdleExpiresAt, IsRevoked
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                SYSUTCDATETIME(), SYSUTCDATETIME(),
                DATEADD(DAY, 7, SYSUTCDATETIME()), DATEADD(HOUR, 4, SYSUTCDATETIME()), 0
            )
        """, new_session_id, sess.UserId, new_refresh_hash, new_csrf_hash, ua, ip)
        cn.commit()

        new_jwt = token_for(sess, session_id=new_session_id)
        user_data = {
            "id": str(sess.UserId),
            "email": sess.Email,
            "name": sess.FullName,
            "role": sess.RoleCode,
            "emailVerified": bool(int(sess.EmailVerified or 0))
        }

        new_cookies = make_session_cookie_headers(new_jwt, new_refresh, new_csrf, is_sec)
        return response(
            {"token": new_jwt, "user": user_data, "csrfToken": new_csrf},
            cookies=new_cookies,
            req=req
        )

@app.route(route="auth/register", methods=["POST", "OPTIONS"])
def register(req):
    if (x := options(req)):
        return x

    # Limitación de peticiones por IP
    allowed, retry_after = rate_limit_check("register", req)
    if not allowed:
        return rate_limited_response(retry_after, req=req)

    d = body(req)
    required = ["email", "password", "fullName"]
    if any(not d.get(k) for k in required):
        return response({"error": "Faltan campos obligatorios"}, 400, req=req)

    plain_password = str(d.get("password") or "").strip()
    if len(plain_password) < 8:
        return response({"error": "La contraseña debe tener al menos 8 caracteres"}, 400, req=req)

    uid = str(uuid.uuid4())
    pwd = hash_password_argon2(plain_password)
    clean_email = d["email"].lower().strip()

    try:
        with conn() as cn:
            cur = cn.cursor()
            cur.execute("INSERT mira.Users(UserId,Email,PasswordHash,FullName,Phone,Company,RoleId) SELECT ?,?,?,?,?,?,RoleId FROM mira.Roles WHERE Code='CLIENT'", uid, clean_email, pwd, d["fullName"], d.get("phone"), d.get("company"))
            cn.commit()
        return response({"id": uid, "email": clean_email, "emailVerified": False}, 201, req=req)
    except pyodbc.IntegrityError:
        # Prevención de enumeración de cuentas sin exponer detalles internos de BD
        return response({"error": "El correo ya está registrado o no se pudo completar la solicitud"}, 409, req=req)

@app.route(route="auth/request-email-verification", methods=["POST", "OPTIONS"])
def request_email_verification(req):
    if (x := options(req)):
        return x

    d = body(req)
    claim = auth(req)
    email = (d.get("email") or (claim["email"] if claim else "")).lower().strip()
    if not email:
        return response({"error": "Correo requerido"}, 400, req=req)

    # Limitación de peticiones en capa de aplicación
    allowed, retry_after = rate_limit_check("otp_request", req, identifier=email)
    if not allowed:
        return rate_limited_response(retry_after, req=req)

    env_name = os.getenv("MIRA_ENV", os.getenv("AZURE_FUNCTIONS_ENVIRONMENT", "development")).lower()
    mode_val = os.getenv("MIRA_EMAIL_VERIFICATION_MODE", "development").lower()
    is_dev_mode = (env_name == "development" and mode_val == "development")

    with conn() as cn:
        cur = cn.cursor()
        if not check_007_schema(cur):
            return response({"error": "La infraestructura de verificación de correo no está disponible en la base de datos (migración 007 pendiente).", "sent": False}, 503, req=req)

        # Intervalo de espera (cooldown) verificado directamente en la base de datos SQL
        cooldown_sec = int(os.getenv("OTP_COOLDOWN_SECONDS", "60"))
        if is_dev_mode:
            hdr_cool = get_header(req, "x-test-cooldown")
            if hdr_cool and hdr_cool.isdigit():
                cooldown_sec = int(hdr_cool)

        last_token = cur.execute(
            "SELECT TOP 1 CreatedAt FROM mira.EmailVerificationTokens WHERE LOWER(Email)=LOWER(?) ORDER BY CreatedAt DESC",
            email
        ).fetchone()

        if last_token and last_token.CreatedAt:
            created_at = last_token.CreatedAt
            if getattr(created_at, "tzinfo", None) is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            elapsed = (datetime.now(timezone.utc) - created_at).total_seconds()
            if elapsed < cooldown_sec:
                wait_time = max(1, int(cooldown_sec - elapsed))
                return response(
                    {"error": f"Por favor espera {wait_time} segundos antes de solicitar un nuevo código.", "retryAfter": wait_time},
                    status=429,
                    headers={"Retry-After": str(wait_time)},
                    req=req
                )

        row = cur.execute("SELECT UserId, IsActive FROM mira.Users WHERE LOWER(Email)=LOWER(?)", email).fetchone()

        # Protección contra enumeración: Si el usuario no existe o está inactivo,
        # devolver respuesta de éxito genérico sin generar token ni exponer estado
        if not row or not row.IsActive:
            return response({
                "sent": True,
                "expiresInMinutes": 15,
                "message": "Si la dirección de correo electrónico está registrada, se ha enviado un código de verificación.",
                "devCode": None
            }, 200, req=req)

        # Invalidar tokens anteriores activos para garantizar unicidad del código vigente
        cur.execute("UPDATE mira.EmailVerificationTokens SET IsUsed=1, UsedAt=SYSUTCDATETIME() WHERE LOWER(Email)=LOWER(?) AND IsUsed=0", email)

        code = str(secrets.randbelow(900000) + 100000)
        code_hash = hashlib.sha256(code.encode()).hexdigest().upper()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        cur.execute("INSERT mira.EmailVerificationTokens(UserId,Email,CodeHash,ExpiresAt) VALUES(?,?,?,?)", row.UserId, email, code_hash, expires_at)
        cn.commit()

    # Registro seguro sin exponer el código en texto plano
    masked_email = f"{email[:3]}***@{email.split('@')[-1]}" if "@" in email else "***"
    if is_dev_mode:
        print(f"[DEV EMAIL] Código de verificación generado para {masked_email} (expira en 15m)")

    return response({
        "sent": True,
        "expiresInMinutes": 15,
        "message": "Código generado correctamente.",
        "devCode": code if is_dev_mode else None
    }, 200, req=req)

@app.route(route="auth/verify-email", methods=["POST", "OPTIONS"])
def verify_email(req):
    if (x := options(req)):
        return x

    d = body(req)
    claim = auth(req)
    email = (d.get("email") or (claim["email"] if claim else "")).lower().strip()
    code = str(d.get("code", "")).strip()

    # Limitación de peticiones por IP y cuenta
    allowed, retry_after = rate_limit_check("otp_verify", req, identifier=email or None)
    if not allowed:
        return rate_limited_response(retry_after, req=req)

    if not email or not code:
        return response({"error": "Correo y código son obligatorios"}, 400, req=req)

    code_hash = hashlib.sha256(code.encode()).hexdigest().upper()

    with conn() as cn:
        cur = cn.cursor()
        if not check_007_schema(cur):
            return response({"error": "La infraestructura de verificación de correo no está disponible en la base de datos (migración 007 pendiente).", "verified": False}, 503, req=req)

        user_row = cur.execute("SELECT u.UserId,u.Email,u.FullName,u.IsActive,r.Code RoleCode FROM mira.Users u JOIN mira.Roles r ON r.RoleId=u.RoleId WHERE LOWER(u.Email)=LOWER(?)", email).fetchone()

        # Buscar el token activo más reciente
        token_row = cur.execute(
            "SELECT TOP 1 TokenId,CodeHash,ExpiresAt,Attempts,MaxAttempts FROM mira.EmailVerificationTokens WHERE LOWER(Email)=LOWER(?) AND IsUsed=0 ORDER BY CreatedAt DESC",
            email
        ).fetchone()

        # Protección contra enumeración: Respuesta uniforme de error para usuarios inexistentes, inactivos o sin token
        if not user_row or not user_row.IsActive or not token_row:
            return response({"error": "Código de verificación inválido o expirado. Solicita uno nuevo."}, 400, req=req)

        # Validación estricta de expiración
        expires_at = token_row.ExpiresAt
        if getattr(expires_at, "tzinfo", None) is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return response({"error": "El código de verificación ha expirado. Solicita uno nuevo."}, 400, req=req)

        # Validación de límite de intentos fallidos
        if token_row.Attempts >= token_row.MaxAttempts:
            return response({"error": "Has superado el número máximo de intentos permitidos. Solicita un nuevo código."}, 400, req=req)

        # Validación criptográfica del código
        if not secrets.compare_digest(token_row.CodeHash.upper(), code_hash):
            cur.execute("UPDATE mira.EmailVerificationTokens SET Attempts=Attempts+1 WHERE TokenId=? AND IsUsed=0", token_row.TokenId)
            cn.commit()
            if (token_row.Attempts + 1) >= token_row.MaxAttempts:
                return response({"error": "Has superado el número máximo de intentos permitidos. Solicita un nuevo código."}, 400, req=req)
            return response({"error": "Código de verificación inválido."}, 400, req=req)

        # Código válido: Consumo atómico de un solo uso resistente a condiciones de carrera
        cur.execute("""
            UPDATE mira.EmailVerificationTokens 
            SET IsUsed=1, UsedAt=SYSUTCDATETIME() 
            WHERE TokenId=? AND IsUsed=0 AND Attempts < MaxAttempts
        """, token_row.TokenId)

        if cur.rowcount == 0:
            # Otra solicitud concurrente ya consumió el código o superó intentos
            cn.rollback()
            return response({"error": "El código de verificación ya fue utilizado o no es válido."}, 400, req=req)

        # Actualizar usuario como verificado
        cur.execute("UPDATE mira.Users SET EmailVerified=1, EmailVerifiedAt=SYSUTCDATETIME() WHERE UserId=?", user_row.UserId)

        # Vincular solicitudes huérfanas si es cliente
        claimed_folios = []
        if user_row.RoleCode == "CLIENT":
            claimed_folios = claim_requests_for_user(cur, user_row.UserId, user_row.Email)

        cn.commit()

    return response({"verified": True, "emailVerified": True, "claimedCount": len(claimed_folios), "claimedFolios": claimed_folios, "message": "Correo verificado y solicitudes vinculadas."}, req=req)

@app.route(route="requests/claim", methods=["POST", "OPTIONS"])
def claim_requests_route(req):
    if (x := options(req)):
        return x
    claim = auth(req, ["CLIENT"])
    if not claim:
        return response({"error": "No autorizado. Solo clientes pueden vincular solicitudes."}, 403, req=req)
    ok, err = check_csrf(req, claim)
    if not ok:
        return response({"error": err}, 403, req=req)
    user_id = claim["sub"]

    with conn() as cn:
        cur = cn.cursor()
        cur.execute("SELECT COL_LENGTH('mira.Users', 'EmailVerified')")
        has_col = cur.fetchone()[0] is not None
        sql = f"""
            SELECT u.UserId, u.Email, u.IsActive,
                   {'ISNULL(u.EmailVerified, 0)' if has_col else '0'} AS EmailVerified
            FROM mira.Users u
            WHERE u.UserId=? AND u.IsActive=1
        """
        user_row = cur.execute(sql, user_id).fetchone()
        if not user_row:
            return response({"error": "Usuario no encontrado o inactivo"}, 404, req=req)
        is_verified = (int(getattr(user_row, "EmailVerified", 0) or 0) == 1)
        if not is_verified:
            return response({"error": "Debes verificar tu correo electrónico antes de vincular solicitudes públicas.", "emailVerified": False}, 403, req=req)
        folios = claim_requests_for_user(cur, user_id, user_row.Email)
        cn.commit()
    return response({"claimedCount": len(folios), "claimedFolios": folios, "message": f"{len(folios)} solicitud(es) vinculada(s) con éxito."}, req=req)

@app.route(route="requests", methods=["GET", "POST", "OPTIONS"])
def requests(req):
    if (x := options(req)):
        return x
    if req.method == "POST":
        d = body(req)
        claim = auth(req)
        client_id = claim["sub"] if claim and claim["role"] == "CLIENT" else None
        rid = str(uuid.uuid4())
        contact_name = d.get("contactName") or d.get("name")
        email = d.get("email")
        if not contact_name or not email:
            return response({"error": "Nombre y correo son obligatorios"}, 400, req=req)

        location = d.get("location")
        if not location:
            loc_parts = [p for p in [d.get("state"), d.get("municipality"), d.get("address")] if p]
            location = ", ".join(loc_parts) if loc_parts else "No especificada"

        desc_parts = []
        if d.get("description"):
            desc_parts.append(d["description"])
        if d.get("needType"):
            desc_parts.append(f"Tipo de inmueble: {d['needType']}")
        if d.get("requestedDate"):
            desc_parts.append(f"Fecha requerida: {d['requestedDate']}")
        if d.get("comments"):
            desc_parts.append(f"Comentarios: {d['comments']}")
        full_description = "\n\n".join(desc_parts) if desc_parts else None

        need = d.get("need") or d.get("needType") or "Servicio MIRA"

        with conn() as cn:
            cur = cn.cursor()
            cur.execute("INSERT mira.Requests(RequestId,ClientUserId,ContactName,Email,Phone,Company,Location,Need,Urgency,Description,Source) VALUES(?,?,?,?,?,?,?,?,?,?,?)", rid, client_id, contact_name, email.lower().strip(), d.get("phone"), d.get("company"), location, need, d.get("urgency"), full_description, d.get("source", "WEB"))

            for sid in d.get("serviceIds", []):
                try:
                    if isinstance(sid, int):
                        cur.execute("IF EXISTS (SELECT 1 FROM mira.Services WHERE ServiceId=?) INSERT mira.RequestServices(RequestId,ServiceId) VALUES(?,?)", sid, rid, sid)
                    elif isinstance(sid, str):
                        cur.execute("INSERT mira.RequestServices(RequestId,ServiceId) SELECT ?,ServiceId FROM mira.Services WHERE Code=?", rid, sid)
                except Exception:
                    pass

            cur.execute("INSERT mira.StatusHistory(RequestId,NewStatus,Comment,ChangedByUserId) VALUES(?,'E','Solicitud creada',?)", rid, client_id)
            cn.commit()
            row = cur.execute("SELECT Folio FROM mira.Requests WHERE RequestId=?", rid).fetchone()
        return response({"id": rid, "folio": row.Folio if row else None, "status": "E"}, 201, req=req)

    claim = auth(req)
    if not claim:
        return response({"error": "No autorizado"}, 401, req=req)
    where = ""
    params = []
    if claim["role"] == "CLIENT":
        where = "WHERE r.ClientUserId=?"
        params = [claim["sub"]]
    elif claim["role"] == "OPERATOR":
        where = "WHERE r.AssignedOperatorId=?"
        params = [claim["sub"]]
    sql = f"SELECT r.RequestId,r.Folio,r.ContactName,r.Company,r.Location,r.Need,r.Urgency,r.Description,r.Status,r.CreatedAt,u.FullName OperatorName FROM mira.Requests r LEFT JOIN mira.Users u ON u.UserId=r.AssignedOperatorId {where} ORDER BY r.CreatedAt DESC"
    with conn() as cn:
        return response(rows(cn.cursor().execute(sql, *params)), req=req)

@app.route(route="requests/{request_id}/assign", methods=["PATCH", "OPTIONS"])
def assign(req):
    if (x := options(req)):
        return x
    claim = auth(req, ["ADMIN"])
    if not claim:
        return response({"error": "No autorizado"}, 403, req=req)
    ok, err = check_csrf(req, claim)
    if not ok:
        return response({"error": err}, 403, req=req)
    d = body(req)
    rid = req.route_params["request_id"]
    with conn() as cn:
        cur = cn.cursor()
        cur.execute("UPDATE mira.Requests SET AssignedOperatorId=?,AssignedByUserId=?,AssignedAt=SYSUTCDATETIME(),Status='A',UpdatedAt=SYSUTCDATETIME() WHERE RequestId=?", d["operatorId"], claim["sub"], rid)
        cur.execute("INSERT mira.StatusHistory(RequestId,PreviousStatus,NewStatus,Comment,ChangedByUserId) VALUES(?,'E','A','Operador asignado',?)", rid, claim["sub"])
        cn.commit()
    return response({"updated": True}, req=req)

@app.route(route="requests/{request_id}/status", methods=["PATCH", "OPTIONS"])
def change_status(req):
    if (x := options(req)):
        return x
    claim = auth(req)
    if not claim:
        return response({"error": "No autenticado"}, 401, req=req)
    if claim["role"] not in ["OPERATOR", "ADMIN"]:
        return response({"error": "No autorizado"}, 403, req=req)
    ok, err = check_csrf(req, claim)
    if not ok:
        return response({"error": err}, 403, req=req)
    d = body(req)
    status = d.get("status")
    if status not in STATUS:
        return response({"error": "Estatus inválido"}, 400, req=req)
    rid = req.route_params["request_id"]
    try:
        uuid.UUID(rid)
    except (ValueError, TypeError):
        return response({"error": "Solicitud no encontrada"}, 404, req=req)
    try:
        with conn() as cn:
            cur = cn.cursor()
            row = cur.execute("SELECT Status,AssignedOperatorId FROM mira.Requests WHERE RequestId=?", rid).fetchone()
            if not row:
                return response({"error": "Solicitud no encontrada"}, 404, req=req)
            if claim["role"] == "OPERATOR":
                if not row.AssignedOperatorId or str(row.AssignedOperatorId).lower() != str(claim["sub"]).lower():
                    return response({"error": "No tienes autorización para modificar esta solicitud"}, 403, req=req)
                if row.Status in ["T", "C"]:
                    return response({"error": f"No se puede modificar una solicitud con estatus {STATUS.get(row.Status,row.Status)}"}, 400, req=req)
                if status not in ["A", "T"]:
                    return response({"error": "Los operadores solo pueden actualizar el estatus a Atendida o Terminada"}, 400, req=req)
            cur.execute("UPDATE mira.Requests SET Status=?,UpdatedAt=SYSUTCDATETIME() WHERE RequestId=?", status, rid)
            cur.execute("INSERT mira.StatusHistory(RequestId,PreviousStatus,NewStatus,Comment,ChangedByUserId) VALUES(?,?,?,?,?)", rid, row.Status, status, d.get("comment"), claim["sub"])
            cn.commit()
            return response({"status": status, "label": STATUS[status]}, req=req)
    except Exception:
        return response({"error": "Error interno al actualizar estatus"}, 500, req=req)

@app.route(route="requests/{request_id}/notes", methods=["GET", "POST", "OPTIONS"])
def notes(req):
    if (x := options(req)):
        return x
    claim = auth(req)
    rid = req.route_params["request_id"]
    if not claim:
        return response({"error": "No autenticado"}, 401, req=req)
    try:
        uuid.UUID(rid)
    except (ValueError, TypeError):
        return response({"error": "Solicitud no encontrada"}, 404, req=req)
    try:
        with conn() as cn:
            cur = cn.cursor()
            req_row = cur.execute("SELECT RequestId,ClientUserId,AssignedOperatorId FROM mira.Requests WHERE RequestId=?", rid).fetchone()
            if not req_row:
                return response({"error": "Solicitud no encontrada"}, 404, req=req)
            role = claim["role"]
            uid = str(claim["sub"]).lower()
            if req.method == "POST":
                ok, err = check_csrf(req, claim)
                if not ok:
                    return response({"error": err}, 403, req=req)
                if role == "CLIENT":
                    return response({"error": "Los clientes no pueden registrar notas de bitácora técnica"}, 403, req=req)
                if role == "OPERATOR" and (not req_row.AssignedOperatorId or str(req_row.AssignedOperatorId).lower() != uid):
                    return response({"error": "No tienes autorización para registrar notas en esta solicitud"}, 403, req=req)
                note_text = (body(req).get("note") or "").strip()
                if not note_text:
                    return response({"error": "El contenido de la nota es requerido"}, 400, req=req)
                cur.execute("INSERT mira.WorkNotes(RequestId,UserId,Note) VALUES(?,?,?)", rid, claim["sub"], note_text)
                cn.commit()
                return response({"created": True}, 201, req=req)
            # GET method
            if role == "CLIENT" and (not req_row.ClientUserId or str(req_row.ClientUserId).lower() != uid):
                return response({"error": "No tienes autorización para consultar esta solicitud"}, 403, req=req)
            if role == "OPERATOR" and (not req_row.AssignedOperatorId or str(req_row.AssignedOperatorId).lower() != uid):
                return response({"error": "No tienes autorización para consultar esta solicitud"}, 403, req=req)
            return response(rows(cur.execute("SELECT n.WorkNoteId,n.Note,n.CreatedAt,u.FullName Author FROM mira.WorkNotes n JOIN mira.Users u ON u.UserId=n.UserId WHERE n.RequestId=? ORDER BY n.CreatedAt DESC", rid)), req=req)
    except Exception:
        return response({"error": "Error interno al procesar notas"}, 500, req=req)

@app.route(route="dashboard", methods=["GET", "OPTIONS"])
def dashboard(req):
    if (x := options(req)):
        return x
    claim = auth(req)
    if not claim:
        return response({"error": "No autorizado"}, 401, req=req)
    field = {"CLIENT": "ClientUserId", "OPERATOR": "AssignedOperatorId"}.get(claim["role"])
    where = f"WHERE {field}=?" if field else ""
    params = [claim["sub"]] if field else []
    with conn() as cn:
        data = rows(cn.cursor().execute(f"SELECT Status,COUNT(*) Total FROM mira.Requests {where} GROUP BY Status", *params))
    return response({"counts": {x["Status"]: x["Total"] for x in data}, "labels": STATUS}, req=req)

@app.route(route="users", methods=["GET", "POST", "OPTIONS"])
def users(req):
    if (x := options(req)):
        return x
    claim = auth(req, ["ADMIN"])
    if not claim:
        return response({"error": "No autorizado"}, 403, req=req)
    with conn() as cn:
        cur = cn.cursor()
        if req.method == "GET":
            return response(rows(cur.execute("SELECT u.UserId,u.Email,u.FullName,u.IsActive,r.Code RoleCode FROM mira.Users u JOIN mira.Roles r ON r.RoleId=u.RoleId ORDER BY u.FullName")), req=req)
        d = body(req)
        plain_password = str(d.get("password") or "").strip()
        if not plain_password or len(plain_password) < 8:
            return response({"error": "La contraseña es obligatoria y debe tener al menos 8 caracteres"}, 400, req=req)
        pwd = hash_password_argon2(plain_password)
        uid = str(uuid.uuid4())
        cur.execute("INSERT mira.Users(UserId,Email,PasswordHash,FullName,RoleId) SELECT ?,?,?,?,RoleId FROM mira.Roles WHERE Code=?", uid, d["email"].lower().strip(), pwd, d["fullName"], d["role"])
        cn.commit()
        return response({"id": uid}, 201, req=req)
