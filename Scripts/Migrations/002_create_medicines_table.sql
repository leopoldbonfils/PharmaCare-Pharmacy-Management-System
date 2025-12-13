-- =============================================
-- Migration: 002_create_medicines_table.sql
-- Description: Creates the Medicines table
-- Dependencies: None (base table)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating Medicines Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.Medicines', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing Medicines table...';
    -- Drop dependent tables first
    IF OBJECT_ID('dbo.PrescriptionItems', 'U') IS NOT NULL DROP TABLE [dbo].[PrescriptionItems];
    IF OBJECT_ID('dbo.SaleItems', 'U') IS NOT NULL DROP TABLE [dbo].[SaleItems];
    IF OBJECT_ID('dbo.MedicationRequestItems', 'U') IS NOT NULL DROP TABLE [dbo].[MedicationRequestItems];
    DROP TABLE [dbo].[Medicines];
END
GO

-- Create Medicines table
CREATE TABLE [dbo].[Medicines] (
    [MedicineID] INT IDENTITY(1,1) NOT NULL,
    [MedicineName] NVARCHAR(100) NOT NULL,
    [GenericName] NVARCHAR(100) NOT NULL,
    [Manufacturer] NVARCHAR(100) NOT NULL,
    [BatchNumber] NVARCHAR(50) NOT NULL,
    [ExpiryDate] DATETIME2 NOT NULL,
    [StockQuantity] INT NOT NULL DEFAULT 0,
    [ReorderLevel] INT NOT NULL DEFAULT 10,
    [Price] DECIMAL(10,2) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL,
    [Dosage] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [LastUpdated] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Medicines] PRIMARY KEY CLUSTERED ([MedicineID] ASC)
)
GO

-- Create indexes for better query performance
CREATE NONCLUSTERED INDEX [IX_Medicines_MedicineName] ON [dbo].[Medicines] ([MedicineName] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Medicines_GenericName] ON [dbo].[Medicines] ([GenericName] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Medicines_Category] ON [dbo].[Medicines] ([Category] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Medicines_IsActive] ON [dbo].[Medicines] ([IsActive] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Medicines_StockQuantity] ON [dbo].[Medicines] ([StockQuantity] ASC)
GO

-- Index for finding low stock items
CREATE NONCLUSTERED INDEX [IX_Medicines_LowStock] ON [dbo].[Medicines] ([IsActive], [StockQuantity], [ReorderLevel])
GO

PRINT 'Medicines table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[Medicines];
-- =============================================

