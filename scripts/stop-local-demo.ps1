# scripts/stop-local-demo.ps1
# Sistema MIRA — Detiene los procesos locales de Azure Functions, Vite y Azurite

Write-Host "Deteniendo servicios locales de MIRA..." -ForegroundColor Yellow

# Detener func
Get-Process -Name "func" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process | Where-Object { $_.CommandLine -like "*func start*" } -ErrorAction SilentlyContinue | Stop-Process -Force

# Detener vite / node
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" } | Stop-Process -Force

# Detener azurite
Get-Process -Name "azurite" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Todos los servicios locales han sido detenidos correctamente." -ForegroundColor Green

