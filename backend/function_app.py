import azure.functions as func
import hashlib,json,jwt,os,pyodbc,secrets,uuid
from datetime import datetime,timedelta,timezone

app=func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
STATUS={"E":"Enviada","A":"Atendida","C":"Cancelada","T":"Terminada"}

def conn(): return pyodbc.connect(os.environ["SQL_CONNECTION_STRING"])
def response(data,status=200):
    return func.HttpResponse(json.dumps(data,default=str,ensure_ascii=False),status_code=status,mimetype="application/json",headers={"Access-Control-Allow-Origin":os.getenv("ALLOWED_ORIGIN","*"),"Access-Control-Allow-Headers":"authorization,content-type","Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS"})
def body(req):
    try:return req.get_json()
    except:return {}
def token_for(row):
    payload={"sub":str(row.UserId),"email":row.Email,"name":row.FullName,"role":row.RoleCode,"exp":datetime.now(timezone.utc)+timedelta(hours=8)}
    return jwt.encode(payload,os.environ["JWT_SECRET"],algorithm="HS256")
def auth(req,roles=None):
    try:
        value=req.headers.get("Authorization","").replace("Bearer ","")
        claims=jwt.decode(value,os.environ["JWT_SECRET"],algorithms=["HS256"])
        if roles and claims["role"] not in roles: return None
        return claims
    except:return None
def rows(cursor):
    cols=[x[0] for x in cursor.description]
    return [dict(zip(cols,r)) for r in cursor.fetchall()]
def options(req): return response({}) if req.method=="OPTIONS" else None

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

@app.route(route="health",methods=["GET"])
def health(req): return response({"service":"mira-api","status":"ok","utc":datetime.now(timezone.utc)})

@app.route(route="auth/login",methods=["POST","OPTIONS"])
def login(req):
    if (x:=options(req)):return x
    data=body(req);password=hashlib.sha256(str(data.get("password","")).encode()).hexdigest().upper()
    with conn() as cn:
        cur=cn.cursor()
        cur.execute("SELECT COL_LENGTH('mira.Users', 'EmailVerified')")
        has_col = cur.fetchone()[0] is not None
        sql=f"""
            SELECT u.UserId, u.Email, u.FullName, u.IsActive, r.Code RoleCode,
                   {'ISNULL(u.EmailVerified, 0)' if has_col else '0'} AS EmailVerified
            FROM mira.Users u
            JOIN mira.Roles r ON r.RoleId=u.RoleId
            WHERE LOWER(u.Email)=LOWER(?) AND u.PasswordHash=? AND u.IsActive=1
        """
        row=cur.execute(sql, data.get("email"), password).fetchone()
        if not row:return response({"error":"Credenciales incorrectas"},401)
        # Solo si el usuario es CLIENT y tiene EmailVerified == 1 se permite auto-claim en login
        is_verified = (int(getattr(row, "EmailVerified", 0) or 0) == 1)
        if row.RoleCode=="CLIENT" and is_verified:
            claim_requests_for_user(cur, row.UserId, row.Email)
            cn.commit()
    return response({"token":token_for(row),"user":{"id":row.UserId,"email":row.Email,"name":row.FullName,"role":row.RoleCode,"emailVerified":is_verified}})

def check_007_schema(cur):
    try:
        cur.execute("SELECT COL_LENGTH('mira.Users', 'EmailVerified'), OBJECT_ID('mira.EmailVerificationTokens', 'U')")
        row = cur.fetchone()
        return bool(row and row[0] is not None and row[1] is not None)
    except Exception:
        return False

@app.route(route="auth/register",methods=["POST","OPTIONS"])
def register(req):
    if (x:=options(req)):return x
    d=body(req);required=["email","password","fullName"]
    if any(not d.get(k) for k in required):return response({"error":"Faltan campos obligatorios"},400)
    uid=str(uuid.uuid4());pwd=hashlib.sha256(d["password"].encode()).hexdigest().upper()
    try:
        with conn() as cn:
            cur=cn.cursor()
            # El registro crea la cuenta exclusivamente como CLIENT y con EmailVerified = 0
            # NUNCA ejecuta claim en el registro
            cur.execute("INSERT mira.Users(UserId,Email,PasswordHash,FullName,Phone,Company,RoleId) SELECT ?,?,?,?,?,?,RoleId FROM mira.Roles WHERE Code='CLIENT'",uid,d["email"].lower().strip(),pwd,d["fullName"],d.get("phone"),d.get("company"))
            cn.commit()
        return response({"id":uid,"email":d["email"].lower().strip(),"emailVerified":False},201)
    except pyodbc.IntegrityError:return response({"error":"El correo ya está registrado"},409)

@app.route(route="auth/request-email-verification",methods=["POST","OPTIONS"])
def request_email_verification(req):
    if (x:=options(req)):return x
    d=body(req);claim=auth(req);email=(d.get("email") or (claim["email"] if claim else "")).lower().strip()
    if not email:return response({"error":"Correo requerido"},400)
    
    with conn() as cn:
        cur=cn.cursor()
        if not check_007_schema(cur):
            return response({"error":"La infraestructura de verificación de correo no está disponible en la base de datos (migración 007 pendiente).","sent":False},503)
        
        row=cur.execute("SELECT UserId, IsActive FROM mira.Users WHERE LOWER(Email)=LOWER(?)",email).fetchone()
        if not row:
            return response({"error":"Usuario no encontrado","sent":False},404)
        if not row.IsActive:
            return response({"error":"Usuario inactivo","sent":False},403)
            
        code=str(secrets.randbelow(900000)+100000)
        code_hash=hashlib.sha256(code.encode()).hexdigest().upper()
        expires_at=datetime.now(timezone.utc)+timedelta(minutes=15)
        is_dev_mode=os.getenv("MIRA_EMAIL_VERIFICATION_MODE","development")=="development"
        
        cur.execute("INSERT mira.EmailVerificationTokens(UserId,Email,CodeHash,ExpiresAt) VALUES(?,?,?,?)",row.UserId,email,code_hash,expires_at)
        cn.commit()
        
    if is_dev_mode:print(f"[DEV EMAIL] Código de verificación para {email}: {code} (expira en 15m)")
    return response({"sent":True,"expiresInMinutes":15,"message":"Código generado correctamente","devCode":code if is_dev_mode else None})

@app.route(route="auth/verify-email",methods=["POST","OPTIONS"])
def verify_email(req):
    if (x:=options(req)):return x
    d=body(req);claim=auth(req);email=(d.get("email") or (claim["email"] if claim else "")).lower().strip();code=str(d.get("code","")).strip()
    if not email or not code:return response({"error":"Correo y código son obligatorios"},400)
    code_hash=hashlib.sha256(code.encode()).hexdigest().upper()
    with conn() as cn:
        cur=cn.cursor()
        if not check_007_schema(cur):
            return response({"error":"La infraestructura de verificación de correo no está disponible en la base de datos (migración 007 pendiente).","verified":False},503)
            
        user_row=cur.execute("SELECT u.UserId,u.Email,u.FullName,u.IsActive,r.Code RoleCode FROM mira.Users u JOIN mira.Roles r ON r.RoleId=u.RoleId WHERE LOWER(u.Email)=LOWER(?)",email).fetchone()
        if not user_row or not user_row.IsActive:
            return response({"error":"Usuario no encontrado o inactivo"},404)
        
        # Validar el código contra EmailVerificationTokens (requiere coincidencia estricta de hash)
        token_row=cur.execute("SELECT TOP 1 TokenId,CodeHash,ExpiresAt,Attempts,MaxAttempts FROM mira.EmailVerificationTokens WHERE LOWER(Email)=LOWER(?) AND IsUsed=0 ORDER BY CreatedAt DESC",email).fetchone()
        if not token_row:
            return response({"error":"No hay un código de verificación activo para este correo. Solicita uno nuevo."},400)
        
        if token_row.ExpiresAt < datetime.utcnow():
        #if token_row.ExpiresAt < datetime.now(timezone.utc):
            return response({"error":"El código de verificación ha expirado. Solicita uno nuevo."},400)
            
        if token_row.Attempts >= token_row.MaxAttempts:
            return response({"error":"Has superado el número máximo de intentos permitidos. Solicita un nuevo código."},400)
            
        if token_row.CodeHash != code_hash:
            cur.execute("UPDATE mira.EmailVerificationTokens SET Attempts=Attempts+1 WHERE TokenId=?", token_row.TokenId)
            cn.commit()
            return response({"error":"Código de verificación inválido."},400)
        
        # Código válido: marcar token usado y usuario verificado
        cur.execute("UPDATE mira.EmailVerificationTokens SET IsUsed=1,UsedAt=SYSUTCDATETIME() WHERE TokenId=?",token_row.TokenId)
        cur.execute("UPDATE mira.Users SET EmailVerified=1,EmailVerifiedAt=SYSUTCDATETIME() WHERE UserId=?",user_row.UserId)
        
        # Tras verificar el correo satisfactoriamente, vincular solicitudes huérfanas
        claimed_folios=[]
        if user_row.RoleCode=="CLIENT":
            claimed_folios=claim_requests_for_user(cur,user_row.UserId,user_row.Email)
        cn.commit()
    return response({"verified":True,"emailVerified":True,"claimedCount":len(claimed_folios),"claimedFolios":claimed_folios,"message":"Correo verificado y solicitudes vinculadas."})

@app.route(route="requests/claim",methods=["POST","OPTIONS"])
def claim_requests_route(req):
    if (x:=options(req)):return x
    claim=auth(req,["CLIENT"])
    if not claim:return response({"error":"No autorizado. Solo clientes pueden vincular solicitudes."},403)
    user_id=claim["sub"]
    with conn() as cn:
        cur=cn.cursor()
        # Validar en base de datos que el usuario tenga EmailVerified = 1
        cur.execute("SELECT COL_LENGTH('mira.Users', 'EmailVerified')")
        has_col = cur.fetchone()[0] is not None
        sql=f"""
            SELECT u.UserId, u.Email, u.IsActive,
                   {'ISNULL(u.EmailVerified, 0)' if has_col else '0'} AS EmailVerified
            FROM mira.Users u
            WHERE u.UserId=? AND u.IsActive=1
        """
        user_row=cur.execute(sql, user_id).fetchone()
        if not user_row:
            return response({"error":"Usuario no encontrado o inactivo"},404)
        is_verified = (int(getattr(user_row, "EmailVerified", 0) or 0) == 1)
        if not is_verified:
            return response({"error":"Debes verificar tu correo electrónico antes de vincular solicitudes públicas.", "emailVerified":False},403)
        folios=claim_requests_for_user(cur,user_id,user_row.Email)
        cn.commit()
    return response({"claimedCount":len(folios),"claimedFolios":folios,"message":f"{len(folios)} solicitud(es) vinculada(s) con éxito."})

@app.route(route="requests",methods=["GET","POST","OPTIONS"])
def requests(req):
    if (x:=options(req)):return x
    if req.method=="POST":
        d=body(req);claim=auth(req);client_id=claim["sub"] if claim and claim["role"]=="CLIENT" else None;rid=str(uuid.uuid4())
        contact_name=d.get("contactName") or d.get("name")
        email=d.get("email")
        if not contact_name or not email:
            return response({"error":"Nombre y correo son obligatorios"},400)
        
        # Formatear ubicación estructurada si viene por partes
        location=d.get("location")
        if not location:
            loc_parts=[p for p in [d.get("state"),d.get("municipality"),d.get("address")] if p]
            location=", ".join(loc_parts) if loc_parts else "No especificada"
        
        # Formatear descripción combinada para no perder datos del wizard
        desc_parts=[]
        if d.get("description"):desc_parts.append(d["description"])
        if d.get("needType"):desc_parts.append(f"Tipo de inmueble: {d['needType']}")
        if d.get("requestedDate"):desc_parts.append(f"Fecha requerida: {d['requestedDate']}")
        if d.get("comments"):desc_parts.append(f"Comentarios: {d['comments']}")
        full_description="\n\n".join(desc_parts) if desc_parts else None

        need=d.get("need") or d.get("needType") or "Servicio MIRA"

        with conn() as cn:
            cur=cn.cursor()
            cur.execute("INSERT mira.Requests(RequestId,ClientUserId,ContactName,Email,Phone,Company,Location,Need,Urgency,Description,Source) VALUES(?,?,?,?,?,?,?,?,?,?,?)",rid,client_id,contact_name,email.lower().strip(),d.get("phone"),d.get("company"),location,need,d.get("urgency"),full_description,d.get("source","WEB"))
            
            # Asociar servicios de forma segura con mira.Services
            for sid in d.get("serviceIds",[]):
                try:
                    if isinstance(sid,int):
                        cur.execute("IF EXISTS (SELECT 1 FROM mira.Services WHERE ServiceId=?) INSERT mira.RequestServices(RequestId,ServiceId) VALUES(?,?)",sid,rid,sid)
                    elif isinstance(sid,str):
                        cur.execute("INSERT mira.RequestServices(RequestId,ServiceId) SELECT ?,ServiceId FROM mira.Services WHERE Code=?",rid,sid)
                except Exception:pass
            
            cur.execute("INSERT mira.StatusHistory(RequestId,NewStatus,Comment,ChangedByUserId) VALUES(?,'E','Solicitud creada',?)",rid,client_id)
            cn.commit()
            row=cur.execute("SELECT Folio FROM mira.Requests WHERE RequestId=?",rid).fetchone()
        return response({"id":rid,"folio":row.Folio if row else None,"status":"E"},201)
    claim=auth(req)
    if not claim:return response({"error":"No autorizado"},401)
    where="";params=[]
    if claim["role"]=="CLIENT":where="WHERE r.ClientUserId=?";params=[claim["sub"]]
    elif claim["role"]=="OPERATOR":where="WHERE r.AssignedOperatorId=?";params=[claim["sub"]]
    sql=f"SELECT r.RequestId,r.Folio,r.ContactName,r.Company,r.Location,r.Need,r.Urgency,r.Description,r.Status,r.CreatedAt,u.FullName OperatorName FROM mira.Requests r LEFT JOIN mira.Users u ON u.UserId=r.AssignedOperatorId {where} ORDER BY r.CreatedAt DESC"
    with conn() as cn:return response(rows(cn.cursor().execute(sql,*params)))

@app.route(route="requests/{request_id}/assign",methods=["PATCH","OPTIONS"])
def assign(req):
    if (x:=options(req)):return x
    claim=auth(req,["ADMIN"])
    if not claim:return response({"error":"No autorizado"},403)
    d=body(req);rid=req.route_params["request_id"]
    with conn() as cn:
        cur=cn.cursor();cur.execute("UPDATE mira.Requests SET AssignedOperatorId=?,AssignedByUserId=?,AssignedAt=SYSUTCDATETIME(),Status='A',UpdatedAt=SYSUTCDATETIME() WHERE RequestId=?",d["operatorId"],claim["sub"],rid);cur.execute("INSERT mira.StatusHistory(RequestId,PreviousStatus,NewStatus,Comment,ChangedByUserId) VALUES(?,'E','A','Operador asignado',?)",rid,claim["sub"]);cn.commit()
    return response({"updated":True})

@app.route(route="requests/{request_id}/status",methods=["PATCH","OPTIONS"])
def change_status(req):
    if (x:=options(req)):return x
    claim=auth(req,["OPERATOR","ADMIN"]);d=body(req);status=d.get("status")
    if not claim:return response({"error":"No autorizado"},403)
    if status not in STATUS:return response({"error":"Estatus inválido"},400)
    rid=req.route_params["request_id"]
    with conn() as cn:
        cur=cn.cursor();old=cur.execute("SELECT Status FROM mira.Requests WHERE RequestId=?",rid).fetchone();cur.execute("UPDATE mira.Requests SET Status=?,UpdatedAt=SYSUTCDATETIME() WHERE RequestId=?",status,rid);cur.execute("INSERT mira.StatusHistory(RequestId,PreviousStatus,NewStatus,Comment,ChangedByUserId) VALUES(?,?,?,?,?)",rid,old.Status,status,d.get("comment"),claim["sub"]);cn.commit()
    return response({"status":status,"label":STATUS[status]})

@app.route(route="requests/{request_id}/notes",methods=["GET","POST","OPTIONS"])
def notes(req):
    if (x:=options(req)):return x
    claim=auth(req);rid=req.route_params["request_id"]
    if not claim:return response({"error":"No autorizado"},401)
    with conn() as cn:
        cur=cn.cursor()
        if req.method=="POST":
            if claim["role"]=="CLIENT":return response({"error":"No autorizado"},403)
            cur.execute("INSERT mira.WorkNotes(RequestId,UserId,Note) VALUES(?,?,?)",rid,claim["sub"],body(req).get("note"));cn.commit();return response({"created":True},201)
        return response(rows(cur.execute("SELECT n.WorkNoteId,n.Note,n.CreatedAt,u.FullName Author FROM mira.WorkNotes n JOIN mira.Users u ON u.UserId=n.UserId WHERE n.RequestId=? ORDER BY n.CreatedAt DESC",rid)))

@app.route(route="dashboard",methods=["GET","OPTIONS"])
def dashboard(req):
    if (x:=options(req)):return x
    claim=auth(req)
    if not claim:return response({"error":"No autorizado"},401)
    field={"CLIENT":"ClientUserId","OPERATOR":"AssignedOperatorId"}.get(claim["role"]);where=f"WHERE {field}=?" if field else "";params=[claim["sub"]] if field else []
    with conn() as cn:
        data=rows(cn.cursor().execute(f"SELECT Status,COUNT(*) Total FROM mira.Requests {where} GROUP BY Status",*params))
    return response({"counts":{x["Status"]:x["Total"] for x in data},"labels":STATUS})

@app.route(route="users",methods=["GET","POST","OPTIONS"])
def users(req):
    if (x:=options(req)):return x
    claim=auth(req,["ADMIN"])
    if not claim:return response({"error":"No autorizado"},403)
    with conn() as cn:
        cur=cn.cursor()
        if req.method=="GET":return response(rows(cur.execute("SELECT u.UserId,u.Email,u.FullName,u.IsActive,r.Code RoleCode FROM mira.Users u JOIN mira.Roles r ON r.RoleId=u.RoleId ORDER BY u.FullName")))
        d=body(req);pwd=hashlib.sha256(str(d.get("password","123")).encode()).hexdigest().upper();uid=str(uuid.uuid4());cur.execute("INSERT mira.Users(UserId,Email,PasswordHash,FullName,RoleId) SELECT ?,?,?,?,RoleId FROM mira.Roles WHERE Code=?",uid,d["email"],pwd,d["fullName"],d["role"]);cn.commit();return response({"id":uid},201)

