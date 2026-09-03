USE [free-sql-db-2122529];
GO

/* ============================================================
   SISTEMA MIRA
   006_create_service_orders.sql

   Órdenes de servicio
   Historial de estados
   Relación de adjuntos
   ============================================================ */


/* ============================================================
   1. ÓRDENES DE SERVICIO
   ============================================================ */

IF OBJECT_ID('mira.ServiceOrders', 'U') IS NULL
BEGIN
    CREATE TABLE mira.ServiceOrders
    (
        ServiceOrderId uniqueidentifier NOT NULL
            CONSTRAINT PK_ServiceOrders PRIMARY KEY
            DEFAULT NEWID(),

        RequestId uniqueidentifier NOT NULL,

        QuotationId uniqueidentifier NOT NULL,

        QuoteVersionId uniqueidentifier NOT NULL,

        ClientUserId uniqueidentifier NULL,

        AssignedOperatorId uniqueidentifier NULL,

        OrderNumber nvarchar(30) NOT NULL,

        Status varchar(30) NOT NULL
            CONSTRAINT DF_ServiceOrders_Status
            DEFAULT ('PENDING'),

        ServiceLocation nvarchar(500) NULL,

        ScheduledStartDate datetime2 NULL,
        ScheduledEndDate datetime2 NULL,

        ActualStartDate datetime2 NULL,
        ActualEndDate datetime2 NULL,

        Instructions nvarchar(max) NULL,

        ClosingNotes nvarchar(max) NULL,

        CreatedByUserId uniqueidentifier NOT NULL,

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_ServiceOrders_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        UpdatedAt datetime2 NULL,

        IsActive bit NOT NULL
            CONSTRAINT DF_ServiceOrders_IsActive
            DEFAULT (1),

        CONSTRAINT UQ_ServiceOrders_OrderNumber
            UNIQUE (OrderNumber),

        CONSTRAINT FK_ServiceOrders_Request
            FOREIGN KEY (RequestId)
            REFERENCES mira.Requests(RequestId),

        CONSTRAINT FK_ServiceOrders_Quotation
            FOREIGN KEY (QuotationId)
            REFERENCES mira.Quotations(QuotationId),

        CONSTRAINT FK_ServiceOrders_QuoteVersion
            FOREIGN KEY (QuoteVersionId)
            REFERENCES mira.QuoteVersions(QuoteVersionId),

        CONSTRAINT FK_ServiceOrders_Client
            FOREIGN KEY (ClientUserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT FK_ServiceOrders_Operator
            FOREIGN KEY (AssignedOperatorId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT FK_ServiceOrders_CreatedBy
            FOREIGN KEY (CreatedByUserId)
            REFERENCES mira.Users(UserId),

        CONSTRAINT CK_ServiceOrders_Status
            CHECK
            (
                Status IN
                (
                    'PENDING',
                    'SCHEDULED',
                    'IN_PROGRESS',
                    'COMPLETED',
                    'CANCELLED'
                )
            )
    );
END;
GO


/* ============================================================
   2. HISTORIAL DE ESTADOS DE LA ORDEN
   ============================================================ */

IF OBJECT_ID('mira.ServiceOrderStatusHistory', 'U') IS NULL
BEGIN
    CREATE TABLE mira.ServiceOrderStatusHistory
    (
        ServiceOrderStatusHistoryId bigint IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_ServiceOrderStatusHistory
            PRIMARY KEY,

        ServiceOrderId uniqueidentifier NOT NULL,

        PreviousStatus varchar(30) NULL,

        NewStatus varchar(30) NOT NULL,

        ChangedByUserId uniqueidentifier NULL,

        Reason nvarchar(700) NULL,

        ChangedAt datetime2 NOT NULL
            CONSTRAINT DF_ServiceOrderStatusHistory_ChangedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_ServiceOrderStatusHistory_Order
            FOREIGN KEY (ServiceOrderId)
            REFERENCES mira.ServiceOrders(ServiceOrderId),

        CONSTRAINT FK_ServiceOrderStatusHistory_User
            FOREIGN KEY (ChangedByUserId)
            REFERENCES mira.Users(UserId)
    );
END;
GO


/* ============================================================
   3. EXTENDER ADJUNTOS PARA COTIZACIONES Y ÓRDENES
   ============================================================ */

IF COL_LENGTH('mira.Attachments', 'QuotationId') IS NULL
BEGIN
    ALTER TABLE mira.Attachments
    ADD QuotationId uniqueidentifier NULL;
END;
GO


IF COL_LENGTH('mira.Attachments', 'ServiceOrderId') IS NULL
BEGIN
    ALTER TABLE mira.Attachments
    ADD ServiceOrderId uniqueidentifier NULL;
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Attachments_Quotation'
)
BEGIN
    ALTER TABLE mira.Attachments
    ADD CONSTRAINT FK_Attachments_Quotation
        FOREIGN KEY (QuotationId)
        REFERENCES mira.Quotations(QuotationId);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Attachments_ServiceOrder'
)
BEGIN
    ALTER TABLE mira.Attachments
    ADD CONSTRAINT FK_Attachments_ServiceOrder
        FOREIGN KEY (ServiceOrderId)
        REFERENCES mira.ServiceOrders(ServiceOrderId);
END;
GO


/* ============================================================
   4. ÍNDICES
   ============================================================ */

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ServiceOrders_RequestId'
      AND object_id = OBJECT_ID('mira.ServiceOrders')
)
BEGIN
    CREATE INDEX IX_ServiceOrders_RequestId
        ON mira.ServiceOrders(RequestId, CreatedAt DESC);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ServiceOrders_QuotationId'
      AND object_id = OBJECT_ID('mira.ServiceOrders')
)
BEGIN
    CREATE INDEX IX_ServiceOrders_QuotationId
        ON mira.ServiceOrders(QuotationId);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ServiceOrders_AssignedOperatorId'
      AND object_id = OBJECT_ID('mira.ServiceOrders')
)
BEGIN
    CREATE INDEX IX_ServiceOrders_AssignedOperatorId
        ON mira.ServiceOrders(AssignedOperatorId, Status);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ServiceOrderStatusHistory_Order'
      AND object_id = OBJECT_ID('mira.ServiceOrderStatusHistory')
)
BEGIN
    CREATE INDEX IX_ServiceOrderStatusHistory_Order
        ON mira.ServiceOrderStatusHistory
           (ServiceOrderId, ChangedAt DESC);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Attachments_QuotationId'
      AND object_id = OBJECT_ID('mira.Attachments')
)
BEGIN
    CREATE INDEX IX_Attachments_QuotationId
        ON mira.Attachments(QuotationId, CreatedAt DESC);
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Attachments_ServiceOrderId'
      AND object_id = OBJECT_ID('mira.Attachments')
)
BEGIN
    CREATE INDEX IX_Attachments_ServiceOrderId
        ON mira.Attachments(ServiceOrderId, CreatedAt DESC);
END;
GO


/* ============================================================
   5. VERIFICACIÓN
   ============================================================ */

SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'mira'
  AND TABLE_NAME IN
  (
      'ServiceOrders',
      'ServiceOrderStatusHistory'
  )
ORDER BY TABLE_NAME;


SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mira'
  AND TABLE_NAME = 'Attachments'
ORDER BY ORDINAL_POSITION;
GO