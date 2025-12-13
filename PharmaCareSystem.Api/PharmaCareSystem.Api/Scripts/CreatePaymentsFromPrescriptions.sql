-- =============================================
-- PharmaCare System - Create Payments from Existing Prescriptions
-- Migration Script
-- =============================================
-- This script creates Payment records for existing Prescriptions
-- that don't have payments yet
-- Run this script on your PharmaCareDB database

USE [PharmaCareDB]
GO

-- =============================================
-- Create Payments for Approved/Paid/Dispensed Prescriptions
-- =============================================

BEGIN TRANSACTION;

BEGIN TRY
    -- Insert payments for prescriptions that don't have payments yet
    INSERT INTO [dbo].[Payments] (
        [PatientID],
        [PrescriptionID],
        [Amount],
        [Status],
        [Method],
        [TransactionRef],
        [PaymentDetails],
        [PaymentDate],
        [CompletedDate]
    )
    SELECT 
        p.[PatientID],
        p.[PrescriptionID],
        ISNULL((
            SELECT SUM(pi.[Quantity] * m.[Price])
            FROM [dbo].[PrescriptionItems] pi
            INNER JOIN [dbo].[Medicines] m ON pi.[MedicineID] = m.[MedicineID]
            WHERE pi.[PrescriptionID] = p.[PrescriptionID]
        ), 0) AS [Amount],
        CASE 
            WHEN p.[Status] = 'Dispensed' THEN 'Completed'
            WHEN p.[Status] = 'Paid' THEN 'Completed'
            ELSE 'Pending'
        END AS [Status],
        'Cash' AS [Method], -- Default method
        NULL AS [TransactionRef],
        CONCAT('Auto-created payment for prescription #', p.[PrescriptionID]) AS [PaymentDetails],
        p.[CreatedDate] AS [PaymentDate],
        CASE 
            WHEN p.[Status] = 'Dispensed' THEN p.[DispensedDate]
            WHEN p.[Status] = 'Paid' THEN p.[CreatedDate]
            ELSE NULL
        END AS [CompletedDate]
    FROM [dbo].[Prescriptions] p
    WHERE 
        (p.[Status] = 'Approved' OR p.[Status] = 'Paid' OR p.[Status] = 'Dispensed')
        AND NOT EXISTS (
            SELECT 1 
            FROM [dbo].[Payments] pay 
            WHERE pay.[PrescriptionID] = p.[PrescriptionID]
        );

    DECLARE @RowsAffected INT = @@ROWCOUNT;
    
    PRINT '=============================================';
    PRINT CONCAT('Successfully created ', @RowsAffected, ' payment record(s).');
    PRINT '=============================================';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    PRINT '=============================================';
    PRINT 'Error occurred while creating payments:';
    PRINT @ErrorMessage;
    PRINT '=============================================';
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO

-- =============================================
-- Verify Payments Created
-- =============================================
SELECT 
    COUNT(*) AS [TotalPayments],
    SUM(CASE WHEN [Status] = 'Completed' THEN 1 ELSE 0 END) AS [CompletedPayments],
    SUM(CASE WHEN [Status] = 'Pending' THEN 1 ELSE 0 END) AS [PendingPayments]
FROM [dbo].[Payments];
GO

PRINT '=============================================';
PRINT 'Payment creation script completed!';
PRINT '=============================================';

