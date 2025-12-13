-- =============================================
-- Stored Procedure: sp_GetSalesReport
-- Description: Generates sales report with filtering options
-- Parameters: 
--   @StartDate - Start date for report (optional)
--   @EndDate - End date for report (optional)
--   @PharmacistID - Filter by pharmacist (optional, NULL = all)
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetSalesReport')
BEGIN
    DROP PROCEDURE [dbo].[sp_GetSalesReport];
END
GO

CREATE PROCEDURE [dbo].[sp_GetSalesReport]
    @StartDate DATETIME2 NULL = NULL,
    @EndDate DATETIME2 NULL = NULL,
    @PharmacistID INT NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.[SaleID],
        s.[InvoiceNumber],
        s.[SaleDate],
        s.[TotalAmount],
        s.[PaymentMethod],
        s.[PaymentStatus],
        u.[FirstName] + ' ' + u.[LastName] AS [SoldByName],
        p.[FirstName] + ' ' + p.[LastName] AS [PatientName],
        (SELECT COUNT(*) FROM [SaleItems] WHERE [SaleID] = s.[SaleID]) AS [ItemCount]
    FROM [dbo].[Sales] s
    INNER JOIN [dbo].[Users] u ON u.[UserID] = s.[SoldBy]
    LEFT JOIN [dbo].[Patients] p ON p.[PatientID] = s.[PatientID]
    WHERE 
        (@StartDate IS NULL OR s.[SaleDate] >= @StartDate)
        AND (@EndDate IS NULL OR s.[SaleDate] <= @EndDate)
        AND (@PharmacistID IS NULL OR s.[SoldBy] = @PharmacistID)
    ORDER BY s.[SaleDate] DESC;
END
GO

PRINT 'Stored procedure sp_GetSalesReport created successfully!';
GO

