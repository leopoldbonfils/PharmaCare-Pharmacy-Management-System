-- =============================================
-- Migration: 007_create_medication_request_items_table.sql
-- Description: Creates the MedicationRequestItems table
-- Dependencies: MedicationRequests (FK: MedicationRequestID), Medicines (FK: MedicineID)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating MedicationRequestItems Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.MedicationRequestItems', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing MedicationRequestItems table...';
    DROP TABLE [dbo].[MedicationRequestItems];
END
GO

-- Create MedicationRequestItems table
CREATE TABLE [dbo].[MedicationRequestItems] (
    [RequestItemID] INT IDENTITY(1,1) NOT NULL,
    [MedicationRequestID] INT NOT NULL,
    [MedicineID] INT NOT NULL,
    [RequestedQuantity] INT NOT NULL,
    [Notes] NVARCHAR(500) NULL,
    CONSTRAINT [PK_MedicationRequestItems] PRIMARY KEY CLUSTERED ([RequestItemID] ASC),
    CONSTRAINT [FK_MedicationRequestItems_MedicationRequests] FOREIGN KEY ([MedicationRequestID]) 
        REFERENCES [dbo].[MedicationRequests] ([MedicationRequestID]) 
        ON DELETE CASCADE,
    CONSTRAINT [FK_MedicationRequestItems_Medicines] FOREIGN KEY ([MedicineID]) 
        REFERENCES [dbo].[Medicines] ([MedicineID]) 
        ON DELETE RESTRICT
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_MedicationRequestItems_MedicationRequestID] ON [dbo].[MedicationRequestItems] ([MedicationRequestID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MedicationRequestItems_MedicineID] ON [dbo].[MedicationRequestItems] ([MedicineID] ASC)
GO

PRINT 'MedicationRequestItems table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[MedicationRequestItems];
-- =============================================

