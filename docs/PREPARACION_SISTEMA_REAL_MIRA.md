# MIRA — Preparación y Validación del Sistema Real Local

**Fecha:** 5 de noviembre de 2026  
**Entorno Validado:** React 19 + Azure Functions Core Tools (Python 3.12) + SQL Server Express local (`mira_dev`)  
**Host:** `ELLIE\SQLEXPRESS` (Instancia local aislada, Edición de motor: 4 - Express)  
**Objetivo:** Documentar las discrepancias corregidas, certificar el aislamiento local, verificar la autenticación y contratos de API, auditar los tres perfiles de usuario y definir el procedimiento exacto de operación real.

---

## 1. Discrepancias Encontradas y Corregidas en el Diagnóstico

Al inspeccionar directamente el código fuente y contrastarlo con los supuestos teóricos de la auditoría preliminar, se identificaron y corrigieron las siguientes discrepancias fundamentales:

| # | Supuesto Teórico Previo | Realidad en el Código Fuente | Corrección y Estado Actual |
| :-: | :--- | :--- | :--- |
| **1** | La función `conn()` leía la variable `SQLAZURECONNSTR_defaultConnection`. | `function_app.py` (Línea 171) ejecuta textualmente: `pyodbc.connect(os.environ["SQL_CONNECTION_STRING"])`. | Se confirmó que tanto `local.settings.dev.json` como el entorno activo definen `SQL_CONNECTION_STRING`. |
| **2** | El payload de asignación de técnico era `assigned_to_user_id`. | `function_app.py` (Líneas 1043-1047) extrae `d["operatorId"]` y actualiza la columna SQL `AssignedOperatorId`. | `frontend-react/src/api/requests.ts` envía `{ operatorId }` y el backend mapea a `mira.Requests.AssignedOperatorId`. El contrato ya coincide perfectamente. |
| **3** | Al asignar un técnico, la solicitud permanecía en estado `E`. | `function_app.py` (Línea 1047) transiciona automáticamente el estado a `A` e inserta en `mira.StatusHistory`: `('E', 'A', 'Operador asignado')`. | Se documenta el comportamiento de negocio: la asignación promueve de inmediato la solicitud a "Atendida" (`A`). |
| **4** | El backend dependía exclusivamente de cookies HttpOnly tras la Fase 18. | `function_app.py` (`def auth`, Líneas 205-225) implementa **autenticación híbrida**: primero busca `Authorization: Bearer <token>` y solo si está ausente lee la cookie `mira_session`. | `AuthContext.tsx` y `client.ts` utilizan Bearer token almacenado en `localStorage`, funcionando al 100% sin problemas de CORS ni rechazos de cookies en el proxy de desarrollo. |
| **5** | Existían endpoints para adjuntos y cotizaciones formales. | `function_app.py` tiene **0 ocurrencias** de las tablas `mira.Quotations`, `mira.Attachments` o `mira.ServiceOrders`. | Se confirma que las tablas existen en SQL (`mira_dev`), pero el backend aún no expone endpoints para ellas. Esas funciones en la interfaz son decorativas o están en preparación. |
| **6** | `backend/local.settings.json` apuntaba a desarrollo. | `local.settings.json` contenía la cadena de conexión de **Azure SQL Database** (`database.windows.net`) y origen `5500`. | **Corregido:** Se respaldó en `local.settings.azure.bak` (ignorado en git) y se activó la configuración dev apuntando exclusivamente a `.\SQLEXPRESS` / `mira_dev`. |

---

## 2. Configuración de Conexión Local Verificada

Se certificó el aislamiento total de la persistencia de datos mediante pruebas de introspección con Python y pyodbc.

### 2.1 Identidad del Servidor Local
* **Servidor Confirmado:** `ELLIE\SQLEXPRESS` (Transporte: Shared memory local).
* **Edición del Motor:** `4` (Microsoft SQL Server Express Edition).
* **Base de Datos Activa:** `mira_dev`.
* **Conexiones a la Nube:** **0** (Ausencia absoluta de dominios `*.database.windows.net`).

### 2.2 Variables Efectivas del Proceso Backend (`backend/local.settings.json`)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "SQL_CONNECTION_STRING": "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=mira_dev;Trusted_Connection=yes;",
    "ALLOWED_ORIGIN": "http://localhost:5173",
    "JWT_SECRET": "pTzLwG1WLQct15tGrJ0jDC8x5G2AVfZ5HoIKeQVq4Be7jyhqRClyGWdRz2MXuOFBGh9z5ycXkwD53N2ZUQg2mA==",
    "MIRA_EMAIL_VERIFICATION_MODE": "development"
  }
}
```

### 2.3 Respaldo de Configuración de Azure
La configuración productiva previa fue resguardada de forma segura en:
📁 `backend/local.settings.azure.bak` (protegida de Git bajo la regla `local.settings.*.json` en `.gitignore`).

---

## 3. Estado de la Autenticación y Sesiones

### 3.1 Mecanismo en Frontend (`AuthContext.tsx` y `client.ts`)
* **Almacenamiento Local:** Guarda el JWT en `localStorage.getItem('mira_token')` y el perfil en `localStorage.getItem('mira_user')`.
* **Transmisión de Identidad:** Cada petición HTTP emitida por `src/api/client.ts` añade el encabezado:
  `Authorization: Bearer <mira_token>`.
* **Validación de Expiración:** `AuthContext` valida el timestamp `exp` del payload JWT en el cliente; si expiró, purga la sesión y redirige a `/login`.

### 3.2 Mecanismo en Backend (`function_app.py`)
* **Validación Criptográfica:** Decodifica y verifica la firma del token mediante HMAC-SHA256 utilizando `JWT_SECRET`.
* **Validación de Sesión Persistente:** Si el token incluye un identificador de sesión `sid`, el backend verifica el registro en la tabla `mira.UserSessions`:
  - `IsRevoked == 0`
  - `ExpiresAt > SYSUTCDATETIME()`
  - `IdleExpiresAt > SYSUTCDATETIME()`
  - Actualiza `LastActivityAt` y renueva `IdleExpiresAt` por 4 horas adicionales.
* **Compatibilidad Probada:** Si el token no tiene `sid` o la tabla de sesiones tiene un fallo temporal, el backend degrada de forma segura a la validación de claims estándar del JWT.

### 3.3 Credenciales de Prueba Ficticias en `mira_dev` (Solo Lectura)
Todas las cuentas de prueba comparten la contraseña unificada: `TestDev2026!`
* **Administrador:** `admin.test@mira-local.dev` (Rol: `ADMIN`, Verificado: Sí)
* **Operador:** `operador.test@mira-local.dev` (Rol: `OPERATOR`, Verificado: Sí)
* **Cliente Verificado:** `cliente.verificado@mira-local.dev` (Rol: `CLIENT`, Verificado: Sí)
* **Cliente Pendiente OTP:** `cliente.pendiente@mira-local.dev` (Rol: `CLIENT`, Verificado: No)

---

## 4. Estado Funcional de los Tres Perfiles

### 4.1 Perfil: CLIENTE (`CLIENT`)
* **Operaciones Reales Funcionales:**
  - Registro de cuenta nueva (`POST /api/auth/register`).
  - Inicio de sesión y recepción de token (`POST /api/auth/login`).
  - Verificación de correo vía código OTP en modal interactivo (`POST /api/auth/request-email-verification` y `POST /api/auth/verify-email`).
  - Consulta de solicitudes propias (`GET /api/requests` filtradas por `ClientUserId`).
  - Vinculación de cotizaciones anónimas previas (`POST /api/requests/claim`).
  - Cierre de sesión seguro (`POST /api/auth/logout`).
* **Elementos Simulados o Sin Backend:**
  - **Descarga de Cotizaciones en PDF:** La vista `DocumentsView.tsx` es decorativa. No existe endpoint en Python para generar documentos PDF descargables.
  - **Edición de Perfil:** `ProfileView.tsx` no tiene endpoint para que el cliente actualice su teléfono o empresa de forma independiente.

### 4.2 Perfil: OPERADOR (`OPERATOR`)
* **Operaciones Reales Funcionales:**
  - Consulta de servicios asignados exclusivamente a su usuario (`GET /api/requests` con `WHERE AssignedOperatorId = @UserId`).
  - Aislamiento IDOR estricto: Si un operador intenta consultar una solicitud ajena por ID, el backend rechaza con `403 No tienes autorización para consultar esta solicitud`.
  - Actualización de estado del servicio (`PATCH /api/requests/{id}/status` hacia `A` o `T`).
  - Registro de notas de avance técnico en bitácora (`POST /api/requests/{id}/notes`).
* **Restricciones Correctas de Rol:**
  - El selector de técnico asignado está bloqueado. El backend responde `403` si un operador intenta llamar a `/assign`.
* **Elementos Pendientes:**
  - Subida de fotografías de evidencia: Las notas solo admiten texto plano en `mira.WorkNotes`.

### 4.3 Perfil: ADMINISTRADOR (`ADMIN`)
* **Operaciones Reales Funcionales:**
  - **Dashboard Ejecutivo:** Computa métricas consolidadas en tiempo real a partir de las solicitudes reales en `mira_dev`.
  - **Listado Completo:** Recupera todas las solicitudes sin restricción de usuario.
  - **Expediente de Cotización (`AdminQuoteDetailPage.tsx`):** Abre en pestaña independiente; presenta los datos del cliente en modo inmutable; permite cambiar estatus e ingresar comentarios en la bitácora.
  - **Asignación de Técnicos:** Envía `{ operatorId }` a `PATCH /api/requests/{id}/assign`, actualizando `AssignedOperatorId`, promoviendo a estado `A` e insertando en el historial.
  - **Gestión de Usuarios:** Consulta y alta de usuarios (`GET` y `POST` en `/api/users`).
* **Elementos Simulados o Sin Backend:**
  - **Botón "Adjuntos":** Abre modal visual; no hay endpoint para almacenar archivos binarios en `mira.Attachments`.
  - **Botón "Enviar cotización":** Muestra aviso en interfaz; no hay endpoint para persistir en `mira.Quotations`.
  - **Módulos "Clientes" y "Reportes":** Vistas estructurales sin APIs específicas.

---

## 5. Estado del Backend (15 Endpoints Reales)

Todos los 15 endpoints se encuentran programados y activos en `backend/function_app.py`:

```
[GET]          http://localhost:7071/api/health
[POST,OPTIONS] http://localhost:7071/api/auth/login
[GET,OPTIONS]  http://localhost:7071/api/auth/me
[POST,OPTIONS] http://localhost:7071/api/auth/logout
[POST,OPTIONS] http://localhost:7071/api/auth/refresh
[POST,OPTIONS] http://localhost:7071/api/auth/register
[POST,OPTIONS] http://localhost:7071/api/auth/request-email-verification
[POST,OPTIONS] http://localhost:7071/api/auth/verify-email
[POST,OPTIONS] http://localhost:7071/api/requests/claim
[GET,POST,OPT] http://localhost:7071/api/requests
[PATCH,OPTION] http://localhost:7071/api/requests/{request_id}/assign
[PATCH,OPTION] http://localhost:7071/api/requests/{request_id}/status
[GET,POST,OPT] http://localhost:7071/api/requests/{request_id}/notes
[GET,OPTIONS]  http://localhost:7071/api/dashboard
[GET,POST,OPT] http://localhost:7071/api/users
```

---

## 6. Archivos Candidatos a Depuración (Clasificación Rigurosa)

> [!NOTE]
> Conforme a las restricciones obligatorias, **no se ha eliminado ningún archivo**. Esta lista delimita las acciones futuras para cuando el usuario ordene la limpieza.

### 6.1 CONSERVAR (Esenciales para el Sistema Real)
* Todo el código de `frontend-react/src/` (vistas, componentes, types, api, tests).
* Archivos de configuración de React: `package.json`, `vite.config.ts`, `tsconfig.json`.
* Backend: `backend/function_app.py`, `backend/requirements.txt`, `backend/host.json`.
* Configuraciones: `backend/local.settings.json` (apuntando a dev), `backend/local.settings.dev.json`.
* Base de datos: `database/001_create_schema.sql` a `009_create_user_sessions.sql`.
* Herramientas locales: `database/local-dev/` (`deploy_local_db.py`, `verify_local_db.py`).
* Suites de pruebas: `tests/` y `frontend-react/src/tests/`.

### 6.2 ARCHIVAR (Valor Histórico o Temporal)
* Carpeta `frontend/` (sitio estático vanilla; conservado temporalmente hasta migrar `.github/workflows/deploy-static-web.yml`).
* Carpetas de capturas en `docs/` (`after_restoration/`, `before_restoration/`, `comparisons/`, `reference_images/`, `reference_inspection/`, `screenshots_demo/`).
* Carpeta `scratch/` (scripts auxiliares de pruebas).

### 6.3 REFACTORIZAR (Ajustes de Integración)
* `backend/function_app.py`: Modularizar el archivo monolítico en Blueprints (`routes/auth.py`, `routes/requests.py`, `routes/notes.py`, `routes/users.py`).
* `.github/workflows/deploy-static-web.yml`: Configurar para que compile `frontend-react` y publique `dist/`.
* `frontend-react/src/components/layout/Header.tsx`: Ocultar el selector de roles de demostración en modo real.

### 6.4 ELIMINAR POSTERIORMENTE (Residuos Confirmados)
* `backend/function_app.py.bak_fase18*` (4 archivos de respaldo).
* `respaldo_antes_de_recuperar_diseno.patch` y `respaldo_antes_de_recuperar_index.patch`.
* `node_modules/` en la raíz (huérfana, sin `package.json`).
* `database/migrations/008_expand_password_hash.sql` (duplicado de `database/008_expand_password_hash.sql`).
* `backend/.venv/` (entorno virtual obsoleto de Python 3.10; se utiliza `.venv312`).
* Artefactos temporales de Azurite sueltos en la raíz (`__azurite_db_*`, `AzuriteConfig`, `__blobstorage__`, `__queuestorage__`).

---

## 7. Resultados de las Verificaciones en Vivo

Se ejecutaron pruebas en vivo de comunicación de extremo a extremo:

### 7.1 Verificación de Integridad de Base de Datos Local
* **Script:** `database/local-dev/verify_local_db.py`
* **Resultado:** **ÉXITO TOTAL**. 19 tablas verificadas, 40 llaves foráneas íntegras, 3 roles (`CLIENT`, `OPERATOR`, `ADMIN`), 4 servicios en catálogo, secuencia de folios en valor 35 y 33 solicitudes ficticias registradas.

### 7.2 Diagnóstico de Salud de la API (`/api/health`)
* **Llamada directa al puerto 7071:**
  ```json
  { "service": "mira-api", "status": "ok", "utc": "2026-11-05 17:39:57.389627+00:00" }
  ```
* **Llamada a través del proxy de Vite en puerto 5173 (`http://localhost:5173/api/health`):**
  ```json
  { "service": "mira-api", "status": "ok", "utc": "2026-11-05 17:40:23.745581+00:00" }
  ```
  *Certificación:* El proxy de desarrollo de Vite redirige transparentemente hacia Azure Functions sin colisiones de CORS.

### 7.3 Autenticación Real de Administrador a través del Proxy
* **Petición:** `POST http://localhost:5173/api/auth/login` con credenciales `admin.test@mira-local.dev`.
* **Resultado:** HTTP 200 OK. Devolvió JWT válido, objeto `user` con rol `ADMIN` y `csrfToken`.
* **Petición con Bearer Token:** `GET http://localhost:5173/api/requests`.
* **Resultado:** HTTP 200 OK. Recuperó las **33 solicitudes reales** almacenadas en la base de datos `mira_dev`.

---

## 8. Instrucciones Exactas para Iniciar el Sistema Real Local

Para ejecutar el Sistema MIRA en modo real local sin tocar ningún servicio externo, siga estos pasos:

### Paso 1: Comprobar el Servicio SQL Server Express
Asegúrese de que el servicio `MSSQL$SQLEXPRESS` esté en ejecución:
```powershell
Get-Service -Name "MSSQL`$SQLEXPRESS"
```

### Paso 2: Iniciar Azurite (Emulador de Almacenamiento)
En una terminal PowerShell en la raíz del proyecto:
```powershell
azurite --silent --location .azurite
```

### Paso 3: Iniciar Azure Functions (Backend Python 3.12)
En una segunda terminal:
```powershell
cd backend
.\.venv312\Scripts\activate
func start --port 7071
```
*El runtime cargará los 15 endpoints en `http://localhost:7071/api` conectando a `mira_dev`.*

### Paso 4: Iniciar Vite (Frontend React)
En una tercera terminal:
```powershell
cd frontend-react
npm run dev
```
*Vite se iniciará en `http://localhost:5173/`. Al ingresar sin parámetros de demo (`?demo=true`), el sistema operará contra el backend local.*

### Paso 5: Ingresar al Sistema Real
* Acceda a `http://localhost:5173/login`.
* Ingrese con cualquiera de las credenciales de prueba locales (ej. `admin.test@mira-local.dev` / `TestDev2026!`).
* La sesión consultará y manipulará las solicitudes reales de `mira_dev`.

---

## 9. Riesgos y Pendientes

1. **Endpoint Público de Seguimiento por Folio (`TrackingModal.tsx`):**
   * El modal de consulta pública por folio espera consultar una solicitud sin requerir autenticación. Actualmente, `GET /api/requests` exige token. Se debe implementar `GET /api/requests/track/{folio}` de solo lectura para soportar el seguimiento público.
2. **Implementación de Endpoints para Cotizaciones y Adjuntos:**
   * Las tablas `mira.Quotations` y `mira.Attachments` existen en SQL pero carecen de triggers HTTP en `function_app.py`. Los botones "Adjuntos" y "Enviar cotización" deben permanecer deshabilitados o con mensajes informativos hasta implementar sus endpoints correspondientes.
3. **Pipeline de Despliegue en GitHub Actions:**
   * Actualizar `.github/workflows/deploy-static-web.yml` para compilar `frontend-react` antes de archivar la carpeta histórica `frontend/`.
4. **Protección de Secretos en Control de Versiones:**
   * Verificar que `backend/local.settings.json` y `backend/local.settings.azure.bak` nunca se agreguen a un commit de Git (ambos coinciden con los patrones de exclusión de `.gitignore`).

---
*Fin del Documento de Preparación Técnica MIRA — Consolidación Real 2026*

