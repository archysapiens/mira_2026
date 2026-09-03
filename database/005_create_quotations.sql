USE [free-sql-db-2122529];
GO

/* ============================================================
   SISTEMA MIRA
   005_create_quotations.sql

   Cotizaciones
   Versiones
   Conceptos
   Respuestas del cliente
   ============================================================ */


/* ============================================================
   1. COTIZACIONES
   ============================================================ */

IF OBJECT_ID('mira.Quotations', 'U') IS NULL
BEGIN
    CREATE TABLE mira.Quotations
    (
        QuotationId uniqueidentifier NOT NULL
            CONSTRAINT PK_Quotations PRIMARY KEY
            DEFAULT NEWID(),

        RequestId uniqueidentifier NOT NULL,

        ClientUserId uniqueidentifier NULL,

        QuoteNumber nvarchar(30) NOT NULL,

        Status varchar(30) NOT NULL
            CONSTRAINT DF_Quotations_Status
            DEFAULT ('PENDING'),

        CurrentVersion int NOT NULL
            CONSTRAINT DF_Quotations_CurrentVersion
            DEFAULT (1),

        CreatedByUserId uniqueidentifier NOT NULL,

        ExpiresAt datetime2 NULL,

        SentAt datetime2 NULL,
        AcceptedAt datetime2 NULL,
        RejectedAt datetime2 NULL,

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_Quotations_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        UpdatedAt datetime2 NULL,

        IsActive bit NOT NULL
            CONSTRAINT DF_Quotations_IsActive
            DEFAULT (1),

        CONSTRAINT UQ_Quotations_QuoteNumber
            UNIQUE (QuoteNumber),

        CONSTRAINT FK_Quotations_Request
            FOREIGN KEY (RequestId)
            REFERENCES mira.Requests(RequestId),

        CONSTRAINT FK_Quotations_Client
            FOREIGN KEY (ClientUserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT FK_Quotations_CreatedBy
            FOREIGN KEY (CreatedByUserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT CK_Quotations_Status
            CHECK
            (
                Status IN
                (
                    'PENDING',
                    'SENT',
                    'ACCEPTED',
                    'REJECTED',
                    'REQUIRES_MODIFICATION',
                    'EXPIRED',
                    'CANCELLED'
                )
            ),

        CONSTRAINT CK_Quotations_CurrentVersion
            CHECK (CurrentVersion >= 1)
    );
END;
GO


/* ============================================================
   2. VERSIONES DE COTIZACIÓN
   ============================================================ */

IF OBJECT_ID('mira.QuoteVersions', 'U') IS NULL
BEGIN
    CREATE TABLE mira.QuoteVersions
    (
        QuoteVersionId uniqueidentifier NOT NULL
            CONSTRAINT PK_QuoteVersions PRIMARY KEY
            DEFAULT NEWID(),

        QuotationId uniqueidentifier NOT NULL,

        VersionNumber int NOT NULL,

        Currency char(3) NOT NULL
            CONSTRAINT DF_QuoteVersions_Currency
            DEFAULT ('MXN'),

        Subtotal decimal(18,2) NOT NULL
            CONSTRAINT DF_QuoteVersions_Subtotal
            DEFAULT (0),

        DiscountAmount decimal(18,2) NOT NULL
            CONSTRAINT DF_QuoteVersions_Discount
            DEFAULT (0),

        TaxAmount decimal(18,2) NOT NULL
            CONSTRAINT DF_QuoteVersions_Tax
            DEFAULT (0),

        TotalAmount decimal(18,2) NOT NULL
            CONSTRAINT DF_QuoteVersions_Total
            DEFAULT (0),

        ScopeDescription nvarchar(max) NULL,

        Terms nvarchar(max) NULL,

        PaymentTerms nvarchar(1500) NULL,

        ValidityDays int NULL,

        InternalNotes nvarchar(1500) NULL,

        CreatedByUserId uniqueidentifier NOT NULL,

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_QuoteVersions_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_QuoteVersions_Quotation
            FOREIGN KEY (QuotationId)
            REFERENCES mira.Quotations(QuotationId),

        CONSTRAINT FK_QuoteVersions_CreatedBy
            FOREIGN KEY (CreatedByUserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT UQ_QuoteVersions
            UNIQUE (QuotationId, VersionNumber),

        CONSTRAINT CK_QuoteVersions_Version
            CHECK (VersionNumber >= 1),

        CONSTRAINT CK_QuoteVersions_Amounts
            CHECK
            (
                Subtotal >= 0
                AND DiscountAmount >= 0
                AND TaxAmount >= 0
                AND TotalAmount >= 0
            )
    );
END;
GO


/* ============================================================
   3. CONCEPTOS DE LA COTIZACIÓN
   ============================================================ */

IF OBJECT_ID('mira.QuoteItems', 'U') IS NULL
BEGIN
    CREATE TABLE mira.QuoteItems
    (
        QuoteItemId uniqueidentifier NOT NULL
            CONSTRAINT PK_QuoteItems PRIMARY KEY
            DEFAULT NEWID(),

        QuoteVersionId uniqueidentifier NOT NULL,

        Description nvarchar(1000) NOT NULL,

        Quantity decimal(18,3) NOT NULL
            CONSTRAINT DF_QuoteItems_Quantity
            DEFAULT (1),

        Unit nvarchar(50) NULL,

        UnitPrice decimal(18,2) NOT NULL
            CONSTRAINT DF_QuoteItems_UnitPrice
            DEFAULT (0),

        DiscountAmount decimal(18,2) NOT NULL
            CONSTRAINT DF_QuoteItems_Discount
            DEFAULT (0),

        LineSubtotal decimal(18,2) NOT NULL
            CONSTRAINT DF_QuoteItems_Subtotal
            DEFAULT (0),

        SortOrder int NOT NULL
            CONSTRAINT DF_QuoteItems_SortOrder
            DEFAULT (1),

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_QuoteItems_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_QuoteItems_Version
            FOREIGN KEY (QuoteVersionId)
            REFERENCES mira.QuoteVersions(QuoteVersionId),

        CONSTRAINT CK_QuoteItems_Values
            CHECK
            (
                Quantity > 0
                AND UnitPrice >= 0
                AND DiscountAmount >= 0
                AND LineSubtotal >= 0
            )
    );
END;
GO


/* ============================================================
   4. RESPUESTAS DEL CLIENTE
   ============================================================ */

IF OBJECT_ID('mira.QuoteResponses', 'U') IS NULL
BEGIN
    CREATE TABLE mira.QuoteResponses
    (
        QuoteResponseId uniqueidentifier NOT NULL
            CONSTRAINT PK_QuoteResponses PRIMARY KEY
            DEFAULT NEWID(),

        QuotationId uniqueidentifier NOT NULL,

        QuoteVersionId uniqueidentifier NOT NULL,

        UserId uniqueidentifier NULL,

        ResponseType varchar(30) NOT NULL,

        Comments nvarchar(1500) NULL,

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_QuoteResponses_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_QuoteResponses_Quotation
            FOREIGN KEY (QuotationId)
            REFERENCES mira.Quotations(QuotationId),

        CONSTRAINT FK_QuoteResponses_Version
            FOREIGN KEY (QuoteVersionId)
            REFERENCES mira.QuoteVersions(QuoteVersionId),

        CONSTRAINT FK_QuoteResponses_User
            FOREIGN KEY (UserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT CK_QuoteResponses_Type
            CHECK
            (
                ResponseType IN
                (
                    'ACCEPTED',
                    'REJECTED',
                    'MODIFICATION_REQUESTED'
                )
            )
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
    WHERE name = 'IX_Quotations_RequestId'
      AND object_id = OBJECT_ID('mira.Quotations')
)
BEGIN
    CREATE INDEX IX_Quotations_RequestId
        ON mira.Quotations(RequestId, CreatedAt DESC);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Quotations_ClientUserId'
      AND object_id = OBJECT_ID('mira.Quotations')
)
BEGIN
    CREATE INDEX IX_Quotations_ClientUserId
        ON mira.Quotations(ClientUserId, CreatedAt DESC);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_QuoteVersions_QuotationId'
      AND object_id = OBJECT_ID('mira.QuoteVersions')
)
BEGIN
    CREATE INDEX IX_QuoteVersions_QuotationId
        ON mira.QuoteVersions(QuotationId, VersionNumber DESC);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_QuoteItems_QuoteVersionId'
      AND object_id = OBJECT_ID('mira.QuoteItems')
)
BEGIN
    CREATE INDEX IX_QuoteItems_QuoteVersionId
        ON mira.QuoteItems(QuoteVersionId, SortOrder);
END;
GO


/* ============================================================
   6. VERIFICACIÓN
   ============================================================ */

SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'mira'
  AND TABLE_NAME IN
  (
      'Quotations',
      'QuoteVersions',
      'QuoteItems',
      'QuoteResponses'
  )
ORDER BY TABLE_NAME;
GO