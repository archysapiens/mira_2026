import azure.functions as func
import hashlib,json,jwt,os,pyodbc,uuid
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

@app.route(route="health",methods=["GET"])
def health(req): return response({"service":"mira-api","status":"ok","utc":datetime.now(timezone.utc)})

@app.route(route="auth/login",methods=["POST","OPTIONS"])
def login(req):
    if (x:=options(req)):return x
    data=body(req);password=hashlib.sha256(str(data.get("password","")).encode()).hexdigest().upper()
    with conn() as cn:
        row=cn.cursor().execute("SELECT u.UserId,u.Email,u.FullName,r.Code RoleCode FROM mira.Users u JOIN mira.Roles r ON r.RoleId=u.RoleId WHERE LOWER(u.Email)=LOWER(?) AND u.PasswordHash=? AND u.IsActive=1",data.get("email"),password).fetchone()
    if not row:return response({"error":"Credenciales incorrectas"},401)
    return response({"token":token_for(row),"user":{"id":row.UserId,"email":row.Email,"name":row.FullName,"role":row.RoleCode}})

@app.route(route="auth/register",methods=["POST","OPTIONS"])
def register(req):
    if (x:=options(req)):return x
    d=body(req);required=["email","password","fullName"]
    if any(not d.get(k) for k in required):return response({"error":"Faltan campos obligatorios"},400)
    uid=str(uuid.uuid4());pwd=hashlib.sha256(d["password"].encode()).hexdigest().upper()
    try:
        with conn() as cn:
            cn.cursor().execute("INSERT mira.Users(UserId,Email,PasswordHash,FullName,Phone,Company,RoleId) SELECT ?,?,?,?,?,?,RoleId FROM mira.Roles WHERE Code='CLIENT'",uid,d["email"].lower(),pwd,d["fullName"],d.get("phone"),d.get("company"));cn.commit()
        return response({"id":uid,"email":d["email"].lower()},201)
    except pyodbc.IntegrityError:return response({"error":"El correo ya está registrado"},409)

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
    sql=f"SELECT r.RequestId,r.Folio,r.ContactName,r.Company,r.Location,r.Need,r.Urgency,r.Status,r.CreatedAt,u.FullName OperatorName FROM mira.Requests r LEFT JOIN mira.Users u ON u.UserId=r.AssignedOperatorId {where} ORDER BY r.CreatedAt DESC"
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

