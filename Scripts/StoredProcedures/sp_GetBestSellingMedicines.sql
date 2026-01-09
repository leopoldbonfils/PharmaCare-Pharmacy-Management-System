-- =============================================
-- Stored Procedure: sp_GetBestSellingMedicines
-- Description: Retrieves best selling medicines with sales statistics
-- Parameters:
--   @TopN - Number of top medicines to return (default: 10)
--   @StartDate - Start date filter (optional)
--   @EndDate - End date filter (optional)
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetBestSellingMedicines')
BEGIN
    DROP PROCEDURE [dbo].[sp_GetBestSellingMedicines];
END
GO

CREATE PROCEDURE [dbo].[sp_GetBestSellingMedicines]
    @TopN INT = 10,
    @StartDate DATETIME2 NULL = NULL,
    @EndDate DATETIME2 NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@TopN)
        m.[MedicineID],
        m.[MedicineName],
        m.[GenericName],
        m.[Category],
        SUM(si.[Quantity]) AS [TotalQuantitySold],
        SUM(si.[TotalPrice]) AS [TotalRevenue],
        COUNT(DISTINCT s.[SaleID]) AS [SaleCount]
    FROM [dbo].[Medicines] m
    INNER JOIN [dbo].[SaleItems] si ON si.[MedicineID] = m.[MedicineID]
    INNER JOIN [dbo].[Sales] s ON s.[SaleID] = si.[SaleID]
    WHERE 
        m.[IsActive] = 1
        AND (@StartDate IS NULL OR s.[SaleDate] >= @StartDate)
        AND (@EndDate IS NULL OR s.[SaleDate] <= @EndDate)
    GROUP BY 
        m.[MedicineID],
        m.[MedicineName],
        m.[GenericName],
        m.[Category]
    ORDER BY [TotalRevenue] DESC;
END
GO

PRINT 'Stored procedure sp_GetBestSellingMedicines created successfully!';
GO

