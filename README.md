# Sistema MIRA — versión 1

Primera versión codificada del portal público y CRM de MIRA para Azure.

## Componentes

- `database/`: creación de Azure SQL, catálogos, tablas, índices y datos de demostración.
- `backend/`: API REST con Azure Functions Python v2.
- `frontend/`: sitio estático HTML, CSS y JavaScript sin framework.
- `.github/workflows/`: ejemplos de integración continua para Azure.
- `docs/GUIA_GITHUB_AZURE.md`: implementación práctica paso a paso.

## Cuentas de demostración

| Rol | Usuario | Contraseña |
|---|---|---|
| Cliente | `cliente@mira.com` | `123` |
| Operador | `operador@mira.com` | `123` |
| Administrador/root | `admin@mira.com` | `123` |

> Estas contraseñas sólo son para el prototipo. El script almacena un hash SHA-256 inicial para simplificar la demostración. Antes de producción migre a Microsoft Entra External ID o a un algoritmo adaptativo como bcrypt/Argon2.

Consulte [la guía de GitHub y Azure](docs/GUIA_GITHUB_AZURE.md).

