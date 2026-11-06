# MIRA — Suites de Pruebas Automatizadas y Calidad

Este directorio consolida las suites de pruebas automatizadas del Sistema MIRA desarrolladas durante las fases de modernización y validación.

---

## 1. Estructura de Pruebas

```
tests/
├── browser_e2e_validation.mjs    # Suite E2E funcional y visual en navegador real (Google Chrome)
├── e2e_real_integration_test.py  # Suite de integración HTTP real contra Azure Functions y SQL Server local
├── security_idor_test.py          # Suite de regresión de seguridad y control de acceso (Fases 18A y 18B)
├── test_password_migration.py    # Suite de migración de contraseñas a Argon2id (Fase 18C)
├── screenshots/                  # Evidencias visuales capturadas durante la validación visual
│   ├── 01_cotizador_folio_desktop.png
│   ├── 02_tracking_modal_desktop.png
│   ├── 03_client_portal_desktop.png
│   ├── 04_operator_portal_desktop.png
│   ├── 05_admin_portal_desktop.png
│   ├── 06_public_tablet.png
│   ├── 07_public_mobile_menu.png
│   ├── 08_cotizador_mobile.png
│   └── 09_error_invalid_credentials.png
└── README.md                     # Este documento de arquitectura de pruebas
```

---

## 2. Descripción de las Suites

### A. Pruebas Unitarias y de Integración Frontend (Vitest)
- **Ubicación:** `frontend-react/src/tests/`
- **Herramienta:** Vitest 5.0.5 + React Testing Library + jsdom
- **Alcance:** 73 pruebas automatizadas cubriendo autenticación, formulario de cotizador, portales de cliente, operador y administrador, vinculación de solicitudes (`claimRequests`) y control de estado reactivo.
- **Ejecución:**
  ```powershell
  cd frontend-react
  npm test
  ```

### B. Pruebas de Integración HTTP Real (`e2e_real_integration_test.py`)
- **Ubicación:** `tests/e2e_real_integration_test.py`
- **Herramienta:** Python 3.12 con librería estándar (`urllib.request`) y `pyodbc`.
- **Alcance:** 19 pruebas de integración directa contra la base de datos local `mira_dev` en `.\SQLEXPRESS` y el backend en `http://localhost:7071/api` y `http://localhost:5173/api`.
- **Ejecución:**
  ```powershell
  & .\backend\.venv312\Scripts\python.exe tests/e2e_real_integration_test.py
  ```

### C. Validación Funcional Visual E2E en Navegador Real (`browser_e2e_validation.mjs`)
- **Ubicación:** `tests/browser_e2e_validation.mjs`
- **Herramienta:** Playwright sobre Google Chrome local (`C:\Program Files\Google\Chrome\Application\chrome.exe`).
- **Alcance:** 32 pruebas funcionales en navegador real cubriendo:
  1. Portal público institucional y modal de seguimiento.
  2. Cotizador interactivo en 4 pasos y emisión real de folio.
  3. Registro de cliente, verificación de OTP con devCode y auto-claim.
  4. Portal del operador con cambio de estatus y notas de bitácora.
  5. Portal del administrador con métricas (KPIs), asignación de operador y catálogo de usuarios.
  6. Diseño responsivo en resoluciones Escritorio (1280x800), Tableta (768x1024) y Móvil (375x667).
  7. Manejo visual de errores y control de acceso (RBAC).
- **Ejecución:**
  ```powershell
  node tests/browser_e2e_validation.mjs
  ```

### D. Suite de Regresión de Seguridad y Diagnóstico IDOR (`security_idor_test.py`)
- **Ubicación:** `tests/security_idor_test.py`
- **Herramienta:** Python 3.12 con `urllib.request`, `pyodbc` y `PyJWT`.
- **Alcance:** 18 pruebas de control de acceso a nivel de objeto (IDOR), validación de transiciones de estado, manejo seguro de errores (404 controlado) y pruebas funcionales positivas por rol en Azure Functions y `mira_dev`.
- **Ejecución:**
  ```powershell
  & .\backend\.venv312\Scripts\python.exe tests/security_idor_test.py
  ```

### E. Suite de Migración Criptográfica a Argon2id (`test_password_migration.py`)
- **Ubicación:** `tests/test_password_migration.py`
- **Herramienta:** Python 3.12 con `argon2-cffi`, `urllib.request` y `pyodbc`.
- **Alcance:** 14 pruebas de autenticación progresiva dual, re-hasheo automático transparente de cuentas legacy SHA-256 a Argon2id, concurrencia en login, idempotencia DDL e higiene de seguridad.
- **Ejecución:**
  ```powershell
  & .\backend\.venv312\Scripts\python.exe tests/test_password_migration.py
  ```

---

## 3. Requisitos Previos para Ejecución de Pruebas Reales
1. SQL Server Express local ejecutándose con base de datos `mira_dev`.
2. Azurite ejecutándose en segundo plano (`azurite --silent --location .`).
3. Azure Functions Core Tools iniciado con variables de desarrollo en puerto `7071`.
4. Vite dev server iniciado en puerto `5173`.

