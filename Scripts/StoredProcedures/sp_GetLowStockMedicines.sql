-- =============================================
-- Stored Procedure: sp_GetLowStockMedicines
-- Description: Retrieves all medicines that are at or below reorder level
-- Parameters: None
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetLowStockMedicines')
BEGIN
    DROP PROCEDURE [dbo].[sp_GetLowStockMedicines];
END
GO

CREATE PROCEDURE [dbo].[sp_GetLowStockMedicines]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        [MedicineID],
        [MedicineName],
        [GenericName],
        [Category],
        [StockQuantity],
        [ReorderLevel],
        [Price],
        [IsActive]
    FROM [dbo].[Medicines]
    WHERE [IsActive] = 1 
        AND [StockQuantity] <= [ReorderLevel]
    ORDER BY [StockQuantity] ASC, [MedicineName] ASC;
END
GO

PRINT 'Stored procedure sp_GetLowStockMedicines created successfully!';
GO

