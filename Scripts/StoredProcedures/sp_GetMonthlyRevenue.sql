-- =============================================
-- Stored Procedure: sp_GetMonthlyRevenue
-- Description: Generates monthly revenue report
-- Parameters:
--   @StartDate - Start date for report (optional)
--   @EndDate - End date for report (optional)
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetMonthlyRevenue')
BEGIN
    DROP PROCEDURE [dbo].[sp_GetMonthlyRevenue];
END
GO

CREATE PROCEDURE [dbo].[sp_GetMonthlyRevenue]
    @StartDate DATETIME2 NULL = NULL,
    @EndDate DATETIME2 NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        YEAR(s.[SaleDate]) AS [Year],
        MONTH(s.[SaleDate]) AS [Month],
        SUM(s.[TotalAmount]) AS [Revenue],
        COUNT(s.[SaleID]) AS [SalesCount],
        COUNT(DISTINCT s.[PatientID]) AS [PatientCount]
    FROM [dbo].[Sales] s
    WHERE 
        s.[PaymentStatus] = 'Paid'
        AND (@StartDate IS NULL OR s.[SaleDate] >= @StartDate)
        AND (@EndDate IS NULL OR s.[SaleDate] <= @EndDate)
    GROUP BY 
        YEAR(s.[SaleDate]),
        MONTH(s.[SaleDate])
    ORDER BY 
        [Year] DESC,
        [Month] DESC;
END
GO

PRINT 'Stored procedure sp_GetMonthlyRevenue created successfully!';
GO

