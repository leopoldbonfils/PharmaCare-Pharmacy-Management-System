-- =============================================
-- Migration: 009_create_sale_items_table.sql
-- Description: Creates the SaleItems table
-- Dependencies: Sales (FK: SaleID), Medicines (FK: MedicineID)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating SaleItems Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.SaleItems', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing SaleItems table...';
    DROP TABLE [dbo].[SaleItems];
END
GO

-- Create SaleItems table
CREATE TABLE [dbo].[SaleItems] (
    [SaleItemID] INT IDENTITY(1,1) NOT NULL,
    [SaleID] INT NOT NULL,
    [MedicineID] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [UnitPrice] DECIMAL(10,2) NOT NULL,
    [TotalPrice] DECIMAL(10,2) NOT NULL,
    CONSTRAINT [PK_SaleItems] PRIMARY KEY CLUSTERED ([SaleItemID] ASC),
    CONSTRAINT [FK_SaleItems_Sales] FOREIGN KEY ([SaleID]) 
        REFERENCES [dbo].[Sales] ([SaleID]) 
        ON DELETE CASCADE,
    CONSTRAINT [FK_SaleItems_Medicines] FOREIGN KEY ([MedicineID]) 
        REFERENCES [dbo].[Medicines] ([MedicineID]) 
        ON DELETE RESTRICT
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_SaleItems_SaleID] ON [dbo].[SaleItems] ([SaleID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_SaleItems_MedicineID] ON [dbo].[SaleItems] ([MedicineID] ASC)
GO

PRINT 'SaleItems table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[SaleItems];
-- =============================================

