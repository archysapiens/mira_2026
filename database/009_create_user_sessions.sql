-- ==============================================================================
-- MIRA - Fase 18D-2B: Migración 009 - Gestión de Sesiones Seguras y Refresh Tokens
-- Base de datos: mira_dev
-- Objetivo: Almacenar sesiones con tokens rotativos, revocación y protección CSRF.
-- ==============================================================================

USE [mira_dev];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('mira.UserSessions', 'U') IS NULL
BEGIN
    PRINT 'Creando tabla mira.UserSessions...';

    CREATE TABLE mira.UserSessions (
        SessionId UNIQUEIDENTIFIER NOT NULL 
            CONSTRAINT DF_UserSessions_SessionId DEFAULT NEWID() 
            CONSTRAINT PK_UserSessions PRIMARY KEY CLUSTERED,
        UserId UNIQUEIDENTIFIER NOT NULL 
            CONSTRAINT FK_UserSessions_Users FOREIGN KEY REFERENCES mira.Users(UserId) ON DELETE CASCADE,
        RefreshTokenHash VARCHAR(64) NOT NULL,
        CsrfTokenHash VARCHAR(64) NOT NULL,
        UserAgent VARCHAR(255) NULL,
        IpAddress VARCHAR(45) NULL,
        CreatedAt DATETIME2(0) NOT NULL 
            CONSTRAINT DF_UserSessions_CreatedAt DEFAULT SYSUTCDATETIME(),
        LastActivityAt DATETIME2(0) NOT NULL 
            CONSTRAINT DF_UserSessions_LastActivity DEFAULT SYSUTCDATETIME(),
        ExpiresAt DATETIME2(0) NOT NULL,
        IdleExpiresAt DATETIME2(0) NOT NULL,
        IsRevoked BIT NOT NULL 
            CONSTRAINT DF_UserSessions_IsRevoked DEFAULT 0,
        RevokedAt DATETIME2(0) NULL,
        ReplacedBySessionId UNIQUEIDENTIFIER NULL
    );

    PRINT 'Creando índices para mira.UserSessions...';

    CREATE NONCLUSTERED INDEX IX_UserSessions_UserId 
        ON mira.UserSessions(UserId, IsRevoked) 
        INCLUDE (SessionId, IdleExpiresAt, ExpiresAt);

    CREATE NONCLUSTERED INDEX IX_UserSessions_RefreshTokenHash 
        ON mira.UserSessions(RefreshTokenHash) 
        INCLUDE (SessionId, UserId, IsRevoked, ExpiresAt);

    PRINT 'Tabla mira.UserSessions creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La tabla mira.UserSessions ya existe. No se realizaron cambios.';
END
GO

