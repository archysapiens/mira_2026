USE [free-sql-db-2122529];
GO

/* ============================================================
   SISTEMA MIRA V2
   003_extend_requests.sql

   Extensión segura del módulo de solicitudes.
   No elimina datos existentes.
   ============================================================ */


/* ============================================================
   1. AMPLIAR SOLICITUDES
   ============================================================ */

IF COL_LENGTH('mira.Requests', 'NeedType') IS NULL
BEGIN
    ALTER TABLE mira.Requests
    ADD NeedType varchar(30) NULL;
END;
GO


IF COL_LENGTH('mira.Requests', 'RequestedDate') IS NULL
BEGIN
    ALTER TABLE mira.Requests
    ADD RequestedDate date NULL;
END;
GO


IF COL_LENGTH('mira.Requests', 'ShortDescription') IS NULL
BEGIN
    ALTER TABLE mira.Requests
    ADD ShortDescription nvarchar(300) NULL;
END;
GO


IF COL_LENGTH('mira.Requests', 'Impact') IS NULL
BEGIN
    ALTER TABLE mira.Requests
    ADD Impact varchar(20) NULL;
END;
GO


IF COL_LENGTH('mira.Requests', 'Priority') IS NULL
BEGIN
    ALTER TABLE mira.Requests
    ADD Priority varchar(20) NULL;
END;
GO


IF COL_LENGTH('mira.Requests', 'ContactType') IS NULL
BEGIN
    ALTER TABLE mira.Requests
    ADD ContactType varchar(30) NULL;
END;
GO


IF COL_LENGTH('mira.Requests', 'ClosedAt') IS NULL
BEGIN
    ALTER TABLE mira.Requests
    ADD ClosedAt datetime2 NULL;
END;
GO


/* ============================================================
   2. NOTAS VISIBLES / INTERNAS
   ============================================================ */

IF COL_LENGTH('mira.WorkNotes', 'IsVisibleToClient') IS NULL
BEGIN
    ALTER TABLE mira.WorkNotes
    ADD IsVisibleToClient bit NOT NULL
        CONSTRAINT DF_WorkNotes_IsVisibleToClient DEFAULT (0);
END;
GO


IF COL_LENGTH('mira.WorkNotes', 'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE mira.WorkNotes
    ADD UpdatedAt datetime2 NULL;
END;
GO


/* ============================================================
   3. HISTORIAL DE ASIGNACIONES
   ============================================================ */

IF OBJECT_ID('mira.RequestAssignments', 'U') IS NULL
BEGIN
    CREATE TABLE mira.RequestAssignments
    (
        AssignmentId bigint IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RequestAssignments PRIMARY KEY,

        RequestId uniqueidentifier NOT NULL,
        AssignedToUserId uniqueidentifier NOT NULL,
        AssignedByUserId uniqueidentifier NULL,

        AssignedAt datetime2 NOT NULL
            CONSTRAINT DF_RequestAssignments_AssignedAt
            DEFAULT SYSUTCDATETIME(),

        UnassignedAt datetime2 NULL,

        IsActive bit NOT NULL
            CONSTRAINT DF_RequestAssignments_IsActive
            DEFAULT (1),

        Notes nvarchar(700) NULL,

        CONSTRAINT FK_RequestAssignments_Request
            FOREIGN KEY (RequestId)
            REFERENCES mira.Requests(RequestId),

        CONSTRAINT FK_RequestAssignments_AssignedTo
            FOREIGN KEY (AssignedToUserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT FK_RequestAssignments_AssignedBy
            FOREIGN KEY (AssignedByUserId)
            REFERENCES mira.Users(UserId)
    );
END;
GO


/* ============================================================
   4. ACTIVIDADES DE SOLICITUD
   ============================================================ */

IF OBJECT_ID('mira.RequestActivities', 'U') IS NULL
BEGIN
    CREATE TABLE mira.RequestActivities
    (
        ActivityId bigint IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RequestActivities PRIMARY KEY,

        RequestId uniqueidentifier NOT NULL,

        UserId uniqueidentifier NULL,

        ActivityType varchar(40) NOT NULL,

        Description nvarchar(1500) NULL,

        IsVisibleToClient bit NOT NULL
            CONSTRAINT DF_RequestActivities_IsVisibleToClient
            DEFAULT (0),

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_RequestActivities_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_RequestActivities_Request
            FOREIGN KEY (RequestId)
            REFERENCES mira.Requests(RequestId),

        CONSTRAINT FK_RequestActivities_User
            FOREIGN KEY (UserId)
            REFERENCES mira.Users(UserId)
    );
END;
GO


/* ============================================================
   5. ÍNDICES
   ============================================================ */

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Requests_ClientUserId'
      AND object_id = OBJECT_ID('mira.Requests')
)
BEGIN
    CREATE INDEX IX_Requests_ClientUserId
        ON mira.Requests(ClientUserId);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Requests_Status'
      AND object_id = OBJECT_ID('mira.Requests')
)
BEGIN
    CREATE INDEX IX_Requests_Status
        ON mira.Requests(Status);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_RequestAssignments_RequestId'
      AND object_id = OBJECT_ID('mira.RequestAssignments')
)
BEGIN
    CREATE INDEX IX_RequestAssignments_RequestId
        ON mira.RequestAssignments(RequestId);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_RequestActivities_RequestId'
      AND object_id = OBJECT_ID('mira.RequestActivities')
)
BEGIN
    CREATE INDEX IX_RequestActivities_RequestId
        ON mira.RequestActivities(RequestId, CreatedAt DESC);
END;
GO


/* ============================================================
   VERIFICACIÓN
   ============================================================ */

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mira'
  AND TABLE_NAME = 'Requests'
ORDER BY ORDINAL_POSITION;

SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'mira'
ORDER BY TABLE_NAME;
GO