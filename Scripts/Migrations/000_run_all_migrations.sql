-- =============================================
-- Master Migration Script: 000_run_all_migrations.sql
-- Description: Runs all database migrations in correct dependency order
-- Usage: Execute this script to set up the entire database schema
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Starting Complete Database Migration...';
PRINT 'Database: PharmaCareDB';
PRINT '=============================================';
PRINT '';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Create Users table (no dependencies)
    PRINT 'Step 1/12: Creating Users table...';
    :r ".\001_create_users_table.sql"
    GO

    -- 2. Create Medicines table (no dependencies)
    PRINT '';
    PRINT 'Step 2/12: Creating Medicines table...';
    :r ".\002_create_medicines_table.sql"
    GO

    -- 3. Create Patients table (depends on Users)
    PRINT '';
    PRINT 'Step 3/12: Creating Patients table...';
    :r ".\003_create_patients_table.sql"
    GO

    -- 4. Create Prescriptions table (depends on Patients, Users)
    PRINT '';
    PRINT 'Step 4/12: Creating Prescriptions table...';
    :r ".\004_create_prescriptions_table.sql"
    GO

    -- 5. Create PrescriptionItems table (depends on Prescriptions, Medicines)
    PRINT '';
    PRINT 'Step 5/12: Creating PrescriptionItems table...';
    :r ".\005_create_prescription_items_table.sql"
    GO

    -- 6. Create MedicationRequests table (depends on Patients, Users, Prescriptions)
    PRINT '';
    PRINT 'Step 6/12: Creating MedicationRequests table...';
    :r ".\006_create_medication_requests_table.sql"
    GO

    -- 7. Create MedicationRequestItems table (depends on MedicationRequests, Medicines)
    PRINT '';
    PRINT 'Step 7/12: Creating MedicationRequestItems table...';
    :r ".\007_create_medication_request_items_table.sql"
    GO

    -- 8. Create Sales table (depends on Patients, Users, MedicationRequests)
    PRINT '';
    PRINT 'Step 8/12: Creating Sales table...';
    :r ".\008_create_sales_table.sql"
    GO

    -- 9. Create SaleItems table (depends on Sales, Medicines)
    PRINT '';
    PRINT 'Step 9/12: Creating SaleItems table...';
    :r ".\009_create_sale_items_table.sql"
    GO

    -- 10. Create Payments table (depends on Patients, Prescriptions, MedicationRequests)
    PRINT '';
    PRINT 'Step 10/12: Creating Payments table...';
    :r ".\010_create_payments_table.sql"
    GO

    -- 11. Create Notifications table (depends on Users)
    PRINT '';
    PRINT 'Step 11/12: Creating Notifications table...';
    :r ".\011_create_notifications_table.sql"
    GO

    -- 12. Create Messages table (depends on Users, Prescriptions)
    PRINT '';
    PRINT 'Step 12/12: Creating Messages table...';
    :r ".\012_create_messages_table.sql"
    GO

    COMMIT TRANSACTION;

    PRINT '';
    PRINT '=============================================';
    PRINT '✓ All migrations completed successfully!';
    PRINT '=============================================';
    PRINT '';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    PRINT '';
    PRINT '=============================================';
    PRINT '✗ Migration failed!';
    PRINT 'Error Number: ' + CAST(ERROR_NUMBER() AS VARCHAR);
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    PRINT 'Error Line: ' + CAST(ERROR_LINE() AS VARCHAR);
    PRINT 'All changes have been rolled back.';
    PRINT '=============================================';
    THROW;
END CATCH
GO

-- Note: The :r command is SQLCMD syntax for including files
-- If running in SSMS or Azure Data Studio, you may need to:
-- 1. Enable SQLCMD mode (Query > SQLCMD Mode)
-- 2. Or run each migration script individually in order
-- 3. Or use the individual migration files directly

