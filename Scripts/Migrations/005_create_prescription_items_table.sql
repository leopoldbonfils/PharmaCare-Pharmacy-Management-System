-- =============================================
-- Migration: 005_create_prescription_items_table.sql
-- Description: Creates the PrescriptionItems table
-- Dependencies: Prescriptions (FK: PrescriptionID), Medicines (FK: MedicineID)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating PrescriptionItems Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.PrescriptionItems', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing PrescriptionItems table...';
    DROP TABLE [dbo].[PrescriptionItems];
END
GO

-- Create PrescriptionItems table
CREATE TABLE [dbo].[PrescriptionItems] (
    [PrescriptionItemID] INT IDENTITY(1,1) NOT NULL,
    [PrescriptionID] INT NOT NULL,
    [MedicineID] INT NOT NULL,
    [Dosage] NVARCHAR(50) NOT NULL,
    [Frequency] NVARCHAR(50) NOT NULL,
    [Duration] NVARCHAR(50) NOT NULL,
    [Quantity] INT NOT NULL,
    [Instructions] NVARCHAR(500) NULL,
    CONSTRAINT [PK_PrescriptionItems] PRIMARY KEY CLUSTERED ([PrescriptionItemID] ASC),
    CONSTRAINT [FK_PrescriptionItems_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE CASCADE,
    CONSTRAINT [FK_PrescriptionItems_Medicines] FOREIGN KEY ([MedicineID]) 
        REFERENCES [dbo].[Medicines] ([MedicineID]) 
        ON DELETE RESTRICT
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_PrescriptionItems_PrescriptionID] ON [dbo].[PrescriptionItems] ([PrescriptionID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_PrescriptionItems_MedicineID] ON [dbo].[PrescriptionItems] ([MedicineID] ASC)
GO

PRINT 'PrescriptionItems table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[PrescriptionItems];
-- =============================================

