USE [free-sql-db-2122529];
GO

/* ============================================================
   SISTEMA MIRA V2
   007_email_verification_and_claim.sql

   Migración para soporte de verificación de correo electrónico
   y vinculación segura de solicitudes públicas huérfanas.
   
   IMPORTANTE:
   - Este script es idempotente y seguro.
   - No elimina tablas ni datos existentes.
   - NO EJECUTAR AUTOMÁTICAMENTE: Presentar para revisión y aprobación.
   ============================================================ */


/* ============================================================
   1. AMPLIAR TABLA DE USUARIOS CON CONTROL DE VERIFICACIÓN
   ============================================================ */

IF COL_LENGTH('mira.Users', 'EmailVerified') IS NULL
BEGIN
    ALTER TABLE mira.Users
    ADD EmailVerified BIT NOT NULL
        CONSTRAINT DF_Users_EmailVerified DEFAULT (0);
END;
GO

IF COL_LENGTH('mira.Users', 'EmailVerifiedAt') IS NULL
BEGIN
    ALTER TABLE mira.Users
    ADD EmailVerifiedAt DATETIME2 NULL;
END;
GO


/* ============================================================
   2. TABLA DE TOKENS / CÓDIGOS DE VERIFICACIÓN DE CORREO
   ============================================================ */

IF OBJECT_ID('mira.EmailVerificationTokens', 'U') IS NULL
BEGIN
    CREATE TABLE mira.EmailVerificationTokens
    (
        TokenId BIGINT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_EmailVerificationTokens PRIMARY KEY,

        UserId UNIQUEIDENTIFIER NOT NULL,

        Email NVARCHAR(320) NOT NULL,

        /* Hash SHA-256 del código OTP o token criptográfico */
        CodeHash VARCHAR(64) NOT NULL,

        ExpiresAt DATETIME2 NOT NULL,

        Attempts TINYINT NOT NULL
            CONSTRAINT DF_EmailVerificationTokens_Attempts DEFAULT (0),

        MaxAttempts TINYINT NOT NULL
            CONSTRAINT DF_EmailVerificationTokens_MaxAttempts DEFAULT (5),

        IsUsed BIT NOT NULL
            CONSTRAINT DF_EmailVerificationTokens_IsUsed DEFAULT (0),

        CreatedAt DATETIME2 NOT NULL
            CONSTRAINT DF_EmailVerificationTokens_CreatedAt DEFAULT SYSUTCDATETIME(),

        UsedAt DATETIME2 NULL,

        CONSTRAINT FK_EmailVerificationTokens_Users
            FOREIGN KEY (UserId)
            REFERENCES mira.Users(UserId)
    );
END;
GO


/* ============================================================
   3. ÍNDICES DE RENDIMIENTO PARA VINCULACIÓN Y VERIFICACIÓN
   ============================================================ */

/* Facilita la búsqueda y vinculación atómica por Email y solicitudes huérfanas */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Requests_Email_ClientUserId'
      AND object_id = OBJECT_ID('mira.Requests')
)
BEGIN
    CREATE INDEX IX_Requests_Email_ClientUserId
        ON mira.Requests(Email, ClientUserId);
END;
GO

/* Facilita la consulta de tokens activos por usuario y correo */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_EmailVerificationTokens_User_Active'
      AND object_id = OBJECT_ID('mira.EmailVerificationTokens')
)
BEGIN
    CREATE INDEX IX_EmailVerificationTokens_User_Active
        ON mira.EmailVerificationTokens(UserId, IsUsed, ExpiresAt);
END;
GO

/* Facilita la consulta y validación rápida de tokens por correo electrónico */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_EmailVerificationTokens_Email_Active'
      AND object_id = OBJECT_ID('mira.EmailVerificationTokens')
)
BEGIN
    CREATE INDEX IX_EmailVerificationTokens_Email_Active
        ON mira.EmailVerificationTokens(Email, IsUsed, CreatedAt);
END;
GO


/* ============================================================
   VERIFICACIÓN DE OBJETOS
   ============================================================ */

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mira'
  AND TABLE_NAME = 'Users'
  AND COLUMN_NAME LIKE 'EmailVerified%';

SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'mira'
  AND TABLE_NAME = 'EmailVerificationTokens';
GO
