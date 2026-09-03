USE [free-sql-db-2122529];
GO

IF OBJECT_ID('mira.Attachments', 'U') IS NULL
BEGIN
    CREATE TABLE mira.Attachments
    (
        AttachmentId uniqueidentifier NOT NULL
            CONSTRAINT PK_Attachments PRIMARY KEY
            DEFAULT NEWID(),

        RequestId uniqueidentifier NULL,

        UploadedByUserId uniqueidentifier NOT NULL,

        OriginalFileName nvarchar(260) NOT NULL,

        StoredFileName nvarchar(260) NOT NULL,

        ContentType nvarchar(150) NOT NULL,

        FileExtension varchar(20) NULL,

        FileSizeBytes bigint NOT NULL,

        BlobContainer nvarchar(120) NOT NULL,

        BlobPath nvarchar(1000) NOT NULL,

        Category varchar(40) NOT NULL
            CONSTRAINT DF_Attachments_Category
            DEFAULT ('GENERAL'),

        Description nvarchar(700) NULL,

        UploadedFrom varchar(30) NULL,

        IsVisibleToClient bit NOT NULL
            CONSTRAINT DF_Attachments_IsVisibleToClient
            DEFAULT (1),

        IsActive bit NOT NULL
            CONSTRAINT DF_Attachments_IsActive
            DEFAULT (1),

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_Attachments_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        UpdatedAt datetime2 NULL,

        CONSTRAINT FK_Attachments_Request
            FOREIGN KEY (RequestId)
            REFERENCES mira.Requests(RequestId),

        CONSTRAINT FK_Attachments_UploadedBy
            FOREIGN KEY (UploadedByUserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT CK_Attachments_FileSize
            CHECK (FileSizeBytes >= 0)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Attachments_RequestId'
      AND object_id = OBJECT_ID('mira.Attachments')
)
BEGIN
    CREATE INDEX IX_Attachments_RequestId
        ON mira.Attachments(RequestId, CreatedAt DESC);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Attachments_UploadedByUserId'
      AND object_id = OBJECT_ID('mira.Attachments')
)
BEGIN
    CREATE INDEX IX_Attachments_UploadedByUserId
        ON mira.Attachments(UploadedByUserId);
END;
GO

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mira'
  AND TABLE_NAME = 'Attachments'
ORDER BY ORDINAL_POSITION;
GO