-- =============================================
-- Stored Procedure: sp_UpdateMedicineStock
-- Description: Updates medicine stock quantity and last updated timestamp
-- Parameters:
--   @MedicineID - ID of the medicine to update
--   @QuantityChange - Amount to add/subtract from stock (can be negative)
--   @NewLastUpdated - Optional new LastUpdated timestamp (defaults to GETDATE())
-- Returns: Updated stock quantity
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpdateMedicineStock')
BEGIN
    DROP PROCEDURE [dbo].[sp_UpdateMedicineStock];
END
GO

CREATE PROCEDURE [dbo].[sp_UpdateMedicineStock]
    @MedicineID INT,
    @QuantityChange INT,
    @NewLastUpdated DATETIME2 NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UpdatedStock INT;
    DECLARE @UpdateDate DATETIME2 = ISNULL(@NewLastUpdated, GETDATE());
    
    UPDATE [dbo].[Medicines]
    SET 
        [StockQuantity] = [StockQuantity] + @QuantityChange,
        [LastUpdated] = @UpdateDate
    WHERE [MedicineID] = @MedicineID;
    
    SELECT @UpdatedStock = [StockQuantity]
    FROM [dbo].[Medicines]
    WHERE [MedicineID] = @MedicineID;
    
    SELECT @UpdatedStock AS [NewStockQuantity];
END
GO

PRINT 'Stored procedure sp_UpdateMedicineStock created successfully!';
GO

