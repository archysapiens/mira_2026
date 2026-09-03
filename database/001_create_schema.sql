/* ============================================================
   SISTEMA MIRA V1
   Archivo: database/001_create_schema.sql
   ============================================================ */

SET NOCOUNT ON;

GO


/* ============================================================
   1. CREAR ESQUEMA MIRA
   ============================================================ */

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = 'mira'
)
BEGIN
    EXEC('CREATE SCHEMA mira');
END;

GO


/* ============================================================
   2. TABLA DE ROLES
   ============================================================ */

CREATE TABLE mira.Roles
(
    RoleId TINYINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Roles PRIMARY KEY,

    Code VARCHAR(20) NOT NULL
        CONSTRAINT UQ_Roles_Code UNIQUE,

    Name NVARCHAR(80) NOT NULL
);

GO


/* ============================================================
   3. TABLA DE USUARIOS
   ============================================================ */

CREATE TABLE mira.Users
(
    UserId UNIQUEIDENTIFIER NOT NULL
        DEFAULT NEWSEQUENTIALID()
        CONSTRAINT PK_Users PRIMARY KEY,

    Email NVARCHAR(320) NOT NULL
        CONSTRAINT UQ_Users_Email UNIQUE,

    PasswordHash VARCHAR(64) NOT NULL,

    FullName NVARCHAR(180) NOT NULL,

    Phone NVARCHAR(30) NULL,

    Company NVARCHAR(180) NULL,

    RoleId TINYINT NOT NULL,

    IsActive BIT NOT NULL
        DEFAULT 1,

    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    UpdatedAt DATETIME2 NULL,

    CONSTRAINT FK_Users_Roles
        FOREIGN KEY (RoleId)
        REFERENCES mira.Roles(RoleId)
);

GO


/* ============================================================
   4. CATÁLOGO DE SERVICIOS
   ============================================================ */

CREATE TABLE mira.Services
(
    ServiceId INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Services PRIMARY KEY,

    Code VARCHAR(40) NOT NULL
        CONSTRAINT UQ_Services_Code UNIQUE,

    Name NVARCHAR(180) NOT NULL,

    Description NVARCHAR(700) NULL,

    IsActive BIT NOT NULL
        DEFAULT 1
);

GO


/* ============================================================
   5. SECUENCIA PARA FOLIOS
   ============================================================ */

CREATE SEQUENCE mira.RequestFolioSequence
    AS BIGINT
    START WITH 1
    INCREMENT BY 1;

GO


/* ============================================================
   6. TABLA DE SOLICITUDES
   ============================================================ */

CREATE TABLE mira.Requests
(
    RequestId UNIQUEIDENTIFIER NOT NULL
        DEFAULT NEWSEQUENTIALID()
        CONSTRAINT PK_Requests PRIMARY KEY,

    /*
        CreatedAt se declara antes de Folio porque
        la columna calculada Folio utiliza el año
        de creación de la solicitud.
    */
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    /*
        Número consecutivo interno.

        Ejemplos:
        1
        2
        3
        ...
    */
    FolioNumber BIGINT NOT NULL
        DEFAULT NEXT VALUE FOR mira.RequestFolioSequence,

    /*
        Folio visible para el usuario.

        Ejemplo:
        MIRA-2026-000001
    */
    Folio AS
    (
        'MIRA-'
        + CONVERT(
            CHAR(4),
            DATEPART(YEAR, CreatedAt)
          )
        + '-'
        + RIGHT(
            '000000'
            + CONVERT(VARCHAR(6), FolioNumber),
            6
          )
    ) PERSISTED,

    /*
        Usuario cliente registrado.
        Puede ser NULL para solicitudes públicas.
    */
    ClientUserId UNIQUEIDENTIFIER NULL,

    ContactName NVARCHAR(180) NOT NULL,

    Email NVARCHAR(320) NOT NULL,

    Phone NVARCHAR(30) NULL,

    Company NVARCHAR(180) NULL,

    Location NVARCHAR(300) NOT NULL,

    Need NVARCHAR(300) NULL,

    Urgency NVARCHAR(80) NULL,

    Description NVARCHAR(1500) NULL,

    /*
        Canal de origen.

        Ejemplos:
        WEB
        PHONE
        EMAIL
        WHATSAPP
        MANUAL
    */
    Source VARCHAR(20) NOT NULL
        DEFAULT 'WEB',

    /*
        Estados generales:

        E = Enviada
        A = Atendida
        C = Cancelada
        T = Terminada
    */
    Status CHAR(1) NOT NULL
        DEFAULT 'E',

    /*
        Ejecutivo / operador responsable.
    */
    AssignedOperatorId UNIQUEIDENTIFIER NULL,

    /*
        Usuario que realizó la asignación.
    */
    AssignedByUserId UNIQUEIDENTIFIER NULL,

    AssignedAt DATETIME2 NULL,

    UpdatedAt DATETIME2 NULL,

    CONSTRAINT CK_Requests_Status
        CHECK (Status IN ('E', 'A', 'C', 'T')),

    CONSTRAINT UQ_Requests_Folio
        UNIQUE (FolioNumber),

    CONSTRAINT FK_Requests_ClientUser
        FOREIGN KEY (ClientUserId)
        REFERENCES mira.Users(UserId),

    CONSTRAINT FK_Requests_AssignedOperator
        FOREIGN KEY (AssignedOperatorId)
        REFERENCES mira.Users(UserId),

    CONSTRAINT FK_Requests_AssignedByUser
        FOREIGN KEY (AssignedByUserId)
        REFERENCES mira.Users(UserId)
);

GO


/* ============================================================
   7. RELACIÓN SOLICITUD - SERVICIOS
   ============================================================ */

CREATE TABLE mira.RequestServices
(
    RequestId UNIQUEIDENTIFIER NOT NULL,

    ServiceId INT NOT NULL,

    CONSTRAINT PK_RequestServices
        PRIMARY KEY (RequestId, ServiceId),

    CONSTRAINT FK_RequestServices_Requests
        FOREIGN KEY (RequestId)
        REFERENCES mira.Requests(RequestId),

    CONSTRAINT FK_RequestServices_Services
        FOREIGN KEY (ServiceId)
        REFERENCES mira.Services(ServiceId)
);

GO


/* ============================================================
   8. NOTAS DE TRABAJO
   ============================================================ */

CREATE TABLE mira.WorkNotes
(
    WorkNoteId BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_WorkNotes PRIMARY KEY,

    RequestId UNIQUEIDENTIFIER NOT NULL,

    UserId UNIQUEIDENTIFIER NOT NULL,

    Note NVARCHAR(2000) NOT NULL,

    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_WorkNotes_Requests
        FOREIGN KEY (RequestId)
        REFERENCES mira.Requests(RequestId),

    CONSTRAINT FK_WorkNotes_Users
        FOREIGN KEY (UserId)
        REFERENCES mira.Users(UserId)
);

GO


/* ============================================================
   9. HISTORIAL DE ESTADOS
   ============================================================ */

CREATE TABLE mira.StatusHistory
(
    StatusHistoryId BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_StatusHistory PRIMARY KEY,

    RequestId UNIQUEIDENTIFIER NOT NULL,

    PreviousStatus CHAR(1) NULL,

    NewStatus CHAR(1) NOT NULL,

    Comment NVARCHAR(700) NULL,

    ChangedByUserId UNIQUEIDENTIFIER NULL,

    ChangedAt DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CK_StatusHistory_NewStatus
        CHECK (NewStatus IN ('E', 'A', 'C', 'T')),

    CONSTRAINT CK_StatusHistory_PreviousStatus
        CHECK (
            PreviousStatus IS NULL
            OR PreviousStatus IN ('E', 'A', 'C', 'T')
        ),

    CONSTRAINT FK_StatusHistory_Requests
        FOREIGN KEY (RequestId)
        REFERENCES mira.Requests(RequestId),

    CONSTRAINT FK_StatusHistory_Users
        FOREIGN KEY (ChangedByUserId)
        REFERENCES mira.Users(UserId)
);

GO


/* ============================================================
   10. NOTIFICACIONES
   ============================================================ */

CREATE TABLE mira.Notifications
(
    NotificationId BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Notifications PRIMARY KEY,

    UserId UNIQUEIDENTIFIER NOT NULL,

    RequestId UNIQUEIDENTIFIER NULL,

    Title NVARCHAR(180) NOT NULL,

    Message NVARCHAR(600) NOT NULL,

    IsRead BIT NOT NULL
        DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Notifications_Users
        FOREIGN KEY (UserId)
        REFERENCES mira.Users(UserId),

    CONSTRAINT FK_Notifications_Requests
        FOREIGN KEY (RequestId)
        REFERENCES mira.Requests(RequestId)
);

GO


/* ============================================================
   11. ÍNDICES
   ============================================================ */

/*
    Facilita consultas por estado y fecha.
*/
CREATE INDEX IX_Requests_StatusCreated
ON mira.Requests
(
    Status,
    CreatedAt DESC
);

GO


/*
    Facilita consultar solicitudes de un cliente.
*/
CREATE INDEX IX_Requests_Client
ON mira.Requests
(
    ClientUserId,
    CreatedAt DESC
);

GO


/*
    Facilita consultar solicitudes asignadas
    a un ejecutivo.
*/
CREATE INDEX IX_Requests_Operator
ON mira.Requests
(
    AssignedOperatorId,
    Status
);

GO


/*
    Facilita recuperar las notas de una solicitud
    en orden cronológico.
*/
CREATE INDEX IX_WorkNotes_Request
ON mira.WorkNotes
(
    RequestId,
    CreatedAt DESC
);

GO


/* ============================================================
   12. VALIDACIÓN DE OBJETOS CREADOS
   ============================================================ */

SELECT
    s.name AS SchemaName,
    t.name AS TableName
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON t.schema_id = s.schema_id
WHERE s.name = 'mira'
ORDER BY t.name;

GO


/* ============================================================
   FIN
   database/001_create_schema.sql
   ============================================================ */
