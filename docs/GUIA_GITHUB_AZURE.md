# Guía práctica: GitHub y Azure — Sistema MIRA V1

## 1. Requisitos

Instale:

1. Git para Windows.
2. Visual Studio Code.
3. Python 3.12 (versión estándar recomendada para desarrollo local; 3.11 compatible).
4. Azure Functions Core Tools v4.
5. Azure CLI.
6. ODBC Driver 18 for SQL Server.
7. Una cuenta GitHub y una suscripción Azure.

Compruebe desde PowerShell:

```powershell
git --version
python --version
func --version
az version
```

## 2. Crear el repositorio en GitHub

1. Ingrese a `https://github.com`.
2. Seleccione **New repository**.
3. Nombre sugerido: `mira-servicios-v1`.
4. Seleccione **Private** durante el desarrollo.
5. No agregue README, `.gitignore` ni licencia; el proyecto ya los contiene.
6. Copie la URL HTTPS del repositorio.

Desde PowerShell, entre a la carpeta del proyecto y ejecute:

```powershell
git init
git branch -M main
git add .
git commit -m "Versión inicial del Sistema MIRA"
git remote add origin https://github.com/USUARIO/mira-servicios-v1.git
git push -u origin main
```

Para cambios posteriores:

```powershell
git checkout -b feature/nombre-del-cambio
git add .
git commit -m "Descripción clara del cambio"
git push -u origin feature/nombre-del-cambio
```

Después abra GitHub, seleccione **Compare & pull request**, revise los archivos y cree el Pull Request hacia `main`.

## 3. Crear Azure SQL Database

### Alternativa económica

Para un MVP utilice Azure SQL Database en modalidad **Serverless**, una sola base de datos, con pausa automática. Revise el costo vigente antes de crear el recurso.

1. Azure Portal → **Create a resource** → **SQL Database**.
2. Cree un grupo de recursos, por ejemplo `rg-mira-dev`.
3. Base: `sqldb-mira-dev`.
4. Servidor lógico: `sql-mira-dev-<sufijo>`.
5. Autenticación: Microsoft Entra administrator y, sólo para el arranque, SQL authentication.
6. Compute: General Purpose → Serverless → mínimo disponible → Auto-pause.
7. Red: agregue temporalmente la IP pública del equipo administrador.

Abra Query Editor, Azure Data Studio o SQL Server Management Studio y ejecute en orden:

```text
database/001_create_schema.sql
database/002_seed_demo.sql
```

Valide:

```sql
SELECT * FROM mira.Roles;
SELECT Email,FullName,IsActive FROM mira.Users;
SELECT Folio,Status,CreatedAt FROM mira.Requests;
```

## 4. Probar el backend localmente

Copie el archivo de ejemplo:

```powershell
cd backend
Copy-Item local.settings.example.json local.settings.json
python -m venv .venv312
.\.venv312\Scripts\Activate.ps1
pip install -r requirements.txt
```

*(Nota: Si conserva el entorno histórico `.venv`, active `.venv312` para ejecutar el backend bajo Python 3.12).*

Edite `local.settings.json` y sustituya servidor, base, usuario, contraseña y `JWT_SECRET`.

Inicie:

```powershell
func start
```

Pruebe salud:

```powershell
Invoke-RestMethod http://localhost:7071/api/health
```

Pruebe login:

```powershell
$body = @{email="admin@mira.com";password="123"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:7071/api/auth/login -ContentType "application/json" -Body $body
```

## 5. Probar el frontend localmente

Abra otra terminal:

```powershell
cd frontend
python -m http.server 5500
```

Abra `http://localhost:5500`. El archivo `frontend/js/config.js` ya apunta a `http://localhost:7071/api`.

## 6. Crear y configurar Azure Function App

1. Azure Portal → **Function App** → Create.
2. Plan recomendado para MVP: **Consumption**.
3. Runtime: Python 3.12 (o Python 3.11 si el recurso en Azure fue creado previamente con esa versión).
4. Sistema operativo: Linux.
5. Nombre sugerido: `func-mira-dev-<sufijo>`.
6. Active Application Insights.
7. En **Configuration / Environment variables** agregue:

| Variable | Valor |
|---|---|
| `SQL_CONNECTION_STRING` | Cadena de conexión de Azure SQL |
| `JWT_SECRET` | Cadena aleatoria de 32 caracteres o más |
| `ALLOWED_ORIGIN` | URL de Azure Static Web Apps |

No guarde secretos dentro de GitHub. En producción use Managed Identity y Azure Key Vault.

Para una primera publicación manual:

```powershell
az login
cd backend
func azure functionapp publish func-mira-dev-SUFIJO --python
```

Pruebe:

```text
https://func-mira-dev-SUFIJO.azurewebsites.net/api/health
```

## 7. Publicar el frontend en Azure Static Web Apps

1. Azure Portal → **Static Web Apps** → Create.
2. Seleccione el repositorio GitHub y rama `main`.
3. Build preset: **Custom**.
4. App location: `/frontend`.
5. API location: déjelo vacío, porque la API está en Function App.
6. Output location: vacío.
7. Finalice la creación.

Actualice `frontend/js/config.js`:

```javascript
window.MIRA_CONFIG={API_URL:"https://func-mira-dev-SUFIJO.azurewebsites.net/api"};
```

Confirme el cambio:

```powershell
git add frontend/js/config.js
git commit -m "Configurar URL de API de Azure"
git push
```

Azure ejecutará el workflow y publicará el sitio.

## 8. Configurar secretos y variables de GitHub Actions

En GitHub: **Settings → Secrets and variables → Actions**.

Secrets:

- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: contenido XML descargado desde Function App → Get publish profile.
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: token de implementación de Static Web Apps.

Variable:

- `AZURE_FUNCTIONAPP_NAME`: nombre exacto de Function App.

Los workflows incluidos publican automáticamente:

- cambios en `backend/**` hacia Azure Functions;
- cambios en `frontend/**` hacia Azure Static Web Apps.

> [!NOTE]
> **Sincronización de versiones entre GitHub Actions y Azure:**  
> El paso `actions/setup-python` en `.github/workflows/deploy-functions.yml` compila las dependencias de Linux (incluyendo binarios en C de `pyodbc`). La versión de Python en el workflow debe coincidir con la versión activa configurada en Azure Function App (`linuxFxVersion`). Si la infraestructura existente en Azure aún utiliza Python 3.11, el administrador debe actualizar el recurso en Azure antes de migrar el workflow a Python 3.12.

## 9. Seguridad antes de producción

1. Elimine o cambie todas las contraseñas `123`.
2. Reemplace SHA-256 por Entra External ID, bcrypt o Argon2.
3. Use Managed Identity entre Function App y Azure SQL.
4. Guarde secretos en Key Vault.
5. Restrinja CORS a la URL exacta del frontend.
6. Active HTTPS Only.
7. Quite el acceso público de Azure SQL cuando exista conectividad privada.
8. Agregue rate limiting, CAPTCHA en registro y recuperación de contraseña.
9. Configure backups, alertas y Application Insights.
10. Separe ambientes `dev`, `test` y `prod`.

## 10. Flujo recomendado de trabajo

```text
feature branch → Pull Request → revisión → merge a main → GitHub Actions → Azure
```

Nunca programe directamente sobre producción. Pruebe primero en desarrollo y conserve scripts de migración numerados.

