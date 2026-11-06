/* ============================================================
   SISTEMA MIRA — FASE 18C
   008_expand_password_hash.sql
   
   Migración para ampliar la columna PasswordHash en mira.Users
   de VARCHAR(64) a VARCHAR(255) para soportar hashes Argon2id.
   
   Características:
   - Totalmente idempotente (seguro de re-ejecutar).
   - Valida tipo y longitud previa.
   - Conserva los valores existentes intactos.
   - Preserva restricción NOT NULL.
   - Manejo transaccional con control de errores.
   - No expone hashes ni datos sensibles.
   ============================================================ */

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @CurrentType NVARCHAR(128);
DECLARE @CurrentLength INT;
DECLARE @IsNullable BIT;

-- 1. Validar existencia de la tabla mira.Users
IF OBJECT_ID('mira.Users', 'U') IS NULL
BEGIN
    RAISERROR('ERROR: La tabla mira.Users no existe en la base de datos actual.', 16, 1);
    RETURN;
END;

-- 2. Inspeccionar tipo y longitud actuales de PasswordHash
SELECT 
    @CurrentType = t.name,
    @CurrentLength = c.max_length,
    @IsNullable = c.is_nullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('mira.Users') AND c.name = 'PasswordHash';

IF @CurrentType IS NULL
BEGIN
    RAISERROR('ERROR: La columna PasswordHash no existe en mira.Users.', 16, 1);
    RETURN;
END;

-- 3. Comprobación idempotente
IF @CurrentType = 'varchar' AND @CurrentLength >= 255
BEGIN
    PRINT '[OK] La columna mira.Users.PasswordHash ya cuenta con longitud suficiente (VARCHAR(' + CAST(@CurrentLength AS NVARCHAR(10)) + ')). No se requieren cambios.';
    RETURN;
END;

-- 4. Validación de esquema previo esperado (debe ser VARCHAR)
IF @CurrentType <> 'varchar'
BEGIN
    RAISERROR('ERROR: El tipo actual de PasswordHash no es VARCHAR (%s). Se detiene la migración.', 16, 1, @CurrentType);
    RETURN;
END;

-- 5. Ejecutar la ampliación de columna dentro de una transacción
BEGIN TRY
    BEGIN TRANSACTION;

    PRINT '[INFO] Modificando columna mira.Users.PasswordHash de VARCHAR(' + CAST(@CurrentLength AS NVARCHAR(10)) + ') a VARCHAR(255) NOT NULL...';
    
    ALTER TABLE mira.Users
    ALTER COLUMN PasswordHash VARCHAR(255) NOT NULL;

    COMMIT TRANSACTION;
    PRINT '[SUCCESS] Columna mira.Users.PasswordHash ampliada exitosamente a VARCHAR(255) NOT NULL.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
        
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrSev INT = ERROR_SEVERITY();
    DECLARE @ErrState INT = ERROR_STATE();
    RAISERROR('ERROR durante la migración de columna: %s', @ErrSev, @ErrState, @ErrMsg);
END CATCH;
GO

