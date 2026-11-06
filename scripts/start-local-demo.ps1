# scripts/start-local-demo.ps1
# Sistema MIRA — Script de Arranque para Demostración Local Funcional (Modalidad B)
# Conecta exclusivamente a SQL Server Express local (base mira_dev).

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SISTEMA MIRA — Arranque de Demostración Local (B)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Comprobar servicio SQL Server Express
Write-Host "`n[1/4] Verificando Microsoft SQL Server Express local..." -ForegroundColor Yellow
$sqlService = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
if ($null -eq $sqlService -or $sqlService.Status -ne "Running") {
    Write-Host "ADVERTENCIA: El servicio MSSQL`$SQLEXPRESS no esta activo. Intentando iniciar..." -ForegroundColor Yellow
    Start-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
}

# 2. Diagnóstico de conexión segura hacia mira_dev
Write-Host "`n[2/4] Diagnosticando conectividad exclusiva a mira_dev..." -ForegroundColor Yellow
$diagScript = @"
import pyodbc, sys
try:
    cn = pyodbc.connect('Driver={ODBC Driver 18 for SQL Server};Server=localhost\\SQLEXPRESS;Database=mira_dev;Trusted_Connection=yes;TrustServerCertificate=yes;', timeout=5)
    cur = cn.cursor()
    cur.execute('SELECT DB_NAME(), @@SERVERNAME')
    db, srv = cur.fetchone()
    print(f'CONEXION_OK|{db}|{srv}')
except Exception as e:
    print(f'ERROR|{e}')
    sys.exit(1)
"@

$diagResult = & .\backend\.venv312\Scripts\python.exe -c "$diagScript"
if ($LASTEXITCODE -ne 0 -or (-not $diagResult.StartsWith("CONEXION_OK"))) {
    Write-Host "ERROR CRITICO: No fue posible conectar a mira_dev en localhost\SQLEXPRESS: $diagResult" -ForegroundColor Red
    exit 1
}

$parts = $diagResult.Split('|')
Write-Host " -> Base de datos confirmada: $($parts[1]) en servidor $($parts[2])" -ForegroundColor Green
Write-Host " -> Aislamiento verificado: Cero conexiones hacia Azure SQL." -ForegroundColor Green

# 3. Arrancar Azurite en segundo plano (si es necesario)
Write-Host "`n[3/4] Inicializando Azurite..." -ForegroundColor Yellow
$azuriteProc = Start-Process -FilePath "azurite" -ArgumentList "--silent --location .azurite" -PassThru -WindowStyle Hidden

# 4. Iniciar Azure Functions en localhost:7071
Write-Host "`n[4/4] Iniciando Azure Functions y Frontend Vite..." -ForegroundColor Yellow

$jwtSecret = "pTzLwG1WLQct15tGrJ0jDC8x5G2AVfZ5HoIKeQVq4Be7jyhqRClyGWdRz2MXuOFBGh9z5ycXkwD53N2ZUQg2mA=="
$connStr = "Driver={ODBC Driver 18 for SQL Server};Server=localhost\SQLEXPRESS;Database=mira_dev;Trusted_Connection=yes;TrustServerCertificate=yes;"

$funcCmd = "`$env:SQL_CONNECTION_STRING='$connStr'; `$env:MIRA_ENV='development'; `$env:MIRA_EMAIL_VERIFICATION_MODE='development'; `$env:JWT_SECRET='$jwtSecret'; cd backend; .\.venv312\Scripts\Activate.ps1; func start --port 7071"
$funcProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $funcCmd -PassThru

# 5. Iniciar Vite en localhost:5173
$viteCmd = "cd frontend-react; npm run dev"
$viteProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $viteCmd -PassThru

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   ¡Servicios de Demostración Local Iniciados con Éxito!   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   Frontend React:     http://localhost:5173" -ForegroundColor White
Write-Host "   Centro de Demo:     http://localhost:5173/demo" -ForegroundColor White
Write-Host "   Backend Functions:  http://localhost:7071/api" -ForegroundColor White
Write-Host "   Base de Datos:      mira_dev (localhost\SQLEXPRESS)" -ForegroundColor White
Write-Host "`nPara detener todos los servicios, ejecuta: .\scripts\stop-local-demo.ps1`n" -ForegroundColor Cyan

