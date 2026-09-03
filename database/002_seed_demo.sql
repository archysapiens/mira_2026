/* ============================================================
   SISTEMA MIRA V1
   Archivo: database/002_seed_demo.sql
   Descripción:
   Inserta datos de demostración para probar el sistema.
   ============================================================ */

SET NOCOUNT ON;

GO


/* ============================================================
   1. ROLES
   ============================================================ */

INSERT mira.Roles(Code, Name)
VALUES
    ('CLIENT',   'Cliente'),
    ('OPERATOR', 'Operador'),
    ('ADMIN',    'Administrador / supervisor root');

GO


/* ============================================================
   2. SERVICIOS
   ============================================================ */

INSERT mira.Services(Code, Name, Description)
VALUES
(
    'SILOS',
    'Limpieza y mantenimiento de silos',
    'Limpieza, sanitización y mantenimiento especializado.'
),
(
    'EPOXY',
    'Recubrimientos epóxicos',
    'Sistemas de protección para industria alimentaria.'
),
(
    'SANITY',
    'Fumigación y sanitización',
    'Control sanitario para instalaciones.'
),
(
    'ROOFS',
    'Mantenimiento de techos',
    'Limpieza y mantenimiento de estructuras y cubiertas.'
);

GO


/* ============================================================
   3. CONTRASEÑA DEMO
   ============================================================ */

/*
    Contraseña demo: 123

    Se genera SHA-256 únicamente para el prototipo.
    No debe utilizarse así en producción.
*/

DECLARE @Hash123 VARCHAR(64);

SET @Hash123 =
    CONVERT(
        VARCHAR(64),
        HASHBYTES('SHA2_256', '123'),
        2
    );


/* ============================================================
   4. USUARIO CLIENTE
   ============================================================ */

INSERT mira.Users
(
    Email,
    PasswordHash,
    FullName,
    Company,
    RoleId
)
SELECT
    'cliente@mira.com',
    @Hash123,
    'Cliente MIRA',
    'Cliente demostración',
    RoleId
FROM mira.Roles
WHERE Code = 'CLIENT';


/* ============================================================
   5. USUARIO OPERADOR
   ============================================================ */

INSERT mira.Users
(
    Email,
    PasswordHash,
    FullName,
    Company,
    RoleId
)
SELECT
    'operador@mira.com',
    @Hash123,
    'Carlos Mendoza',
    'MIRA',
    RoleId
FROM mira.Roles
WHERE Code = 'OPERATOR';


/* ============================================================
   6. USUARIO ADMINISTRADOR
   ============================================================ */

INSERT mira.Users
(
    Email,
    PasswordHash,
    FullName,
    Company,
    RoleId
)
SELECT
    'admin@mira.com',
    @Hash123,
    'Administrador MIRA',
    'MIRA',
    RoleId
FROM mira.Roles
WHERE Code = 'ADMIN';

GO


/* ============================================================
   7. OBTENER IDS DE USUARIOS
   ============================================================ */

DECLARE @Client UNIQUEIDENTIFIER =
(
    SELECT UserId
    FROM mira.Users
    WHERE Email = 'cliente@mira.com'
);

DECLARE @Operator UNIQUEIDENTIFIER =
(
    SELECT UserId
    FROM mira.Users
    WHERE Email = 'operador@mira.com'
);

DECLARE @Admin UNIQUEIDENTIFIER =
(
    SELECT UserId
    FROM mira.Users
    WHERE Email = 'admin@mira.com'
);


/* ============================================================
   8. CREAR IDS DE SOLICITUDES DEMO
   ============================================================ */

DECLARE @R1 UNIQUEIDENTIFIER = NEWID();

DECLARE @R2 UNIQUEIDENTIFIER = NEWID();


/* ============================================================
   9. SOLICITUDES DEMO
   ============================================================ */

INSERT mira.Requests
(
    RequestId,
    ClientUserId,
    ContactName,
    Email,
    Phone,
    Company,
    Location,
    Need,
    Urgency,
    Description,
    Status,
    AssignedOperatorId,
    AssignedByUserId,
    AssignedAt
)
VALUES
(
    @R1,
    @Client,
    'Cliente MIRA',
    'cliente@mira.com',
    '7220000000',
    'Cliente demostración',
    'Toluca, Estado de México',
    'Mantenimiento industrial',
    'Próximos 30 días',
    'Revisión de recubrimiento epóxico.',
    'A',
    @Operator,
    @Admin,
    SYSUTCDATETIME()
),
(
    @R2,
    @Client,
    'Cliente MIRA',
    'cliente@mira.com',
    '7220000000',
    'Cliente demostración',
    'Ixtlahuaca, Estado de México',
    'Limpieza industrial',
    'Lo antes posible',
    'Limpieza y sanitización de silo.',
    'E',
    NULL,
    NULL,
    NULL
);


/* ============================================================
   10. SERVICIO DE SOLICITUD 1
   ============================================================ */

INSERT mira.RequestServices
(
    RequestId,
    ServiceId
)
SELECT
    @R1,
    ServiceId
FROM mira.Services
WHERE Code = 'EPOXY';


/* ============================================================
   11. SERVICIO DE SOLICITUD 2
   ============================================================ */

INSERT mira.RequestServices
(
    RequestId,
    ServiceId
)
SELECT
    @R2,
    ServiceId
FROM mira.Services
WHERE Code = 'SILOS';


/* ============================================================
   12. HISTORIAL DE ESTADOS
   ============================================================ */

INSERT mira.StatusHistory
(
    RequestId,
    PreviousStatus,
    NewStatus,
    Comment,
    ChangedByUserId
)
VALUES
(
    @R1,
    'E',
    'A',
    'Asignada a operador',
    @Admin
),
(
    @R2,
    NULL,
    'E',
    'Solicitud creada desde web',
    @Client
);


/* ============================================================
   13. NOTA DE TRABAJO
   ============================================================ */

INSERT mira.WorkNotes
(
    RequestId,
    UserId,
    Note
)
VALUES
(
    @R1,
    @Operator,
    'Visita técnica confirmada para el jueves.'
);

GO


/* ============================================================
   14. VALIDACIÓN
   ============================================================ */

SELECT *
FROM mira.Roles;

SELECT
    Email,
    FullName,
    IsActive
FROM mira.Users;

SELECT
    Folio,
    Status,
    CreatedAt
FROM mira.Requests
ORDER BY CreatedAt;

GO
