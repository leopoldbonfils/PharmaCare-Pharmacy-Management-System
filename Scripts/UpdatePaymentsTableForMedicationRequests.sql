-- =============================================
-- PharmaCare System - Update Payments Table
-- Add Support for Medication Request Workflow
-- FIXED: Removed strict constraint that was causing rollback
-- =============================================
USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Starting Payments Table Update...';
PRINT '=============================================';
PRINT '';

-- =============================================
-- Step 1: Make PrescriptionID nullable (if not already)
-- =============================================
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') 
    AND name = 'PrescriptionID'
    AND is_nullable = 0
)
BEGIN
    -- Drop foreign key constraint if it exists
    DECLARE @FKPrescriptionName NVARCHAR(255);
    SELECT @FKPrescriptionName = name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('Payments') 
    AND COL_NAME(parent_object_id, parent_column_id) = 'PrescriptionID';
    
    IF @FKPrescriptionName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE [dbo].[Payments] DROP CONSTRAINT [' + @FKPrescriptionName + ']');
        PRINT '✓ Dropped foreign key constraint on PrescriptionID: ' + @FKPrescriptionName;
    END
    
    ALTER TABLE [dbo].[Payments]
    ALTER COLUMN [PrescriptionID] INT NULL;
    
    PRINT '✓ Made PrescriptionID nullable.';
    
    -- Recreate foreign key if it existed
    IF @FKPrescriptionName IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[Payments]
        ADD CONSTRAINT [FK_Payments_Prescription] 
            FOREIGN KEY ([PrescriptionID]) 
            REFERENCES [Prescriptions]([PrescriptionID]) 
            ON DELETE NO ACTION;
        PRINT '✓ Recreated foreign key constraint FK_Payments_Prescription.';
    END
END
ELSE
BEGIN
    PRINT '✓ PrescriptionID is already nullable.';
END
GO

-- =============================================
-- Step 2: Add MedicationRequestID Column
-- =============================================
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') 
    AND name = 'MedicationRequestID'
)
BEGIN
    ALTER TABLE [dbo].[Payments]
    ADD [MedicationRequestID] INT NULL;
    
    PRINT '✓ Added MedicationRequestID column to Payments table.';
END
ELSE
BEGIN
    PRINT '⚠ MedicationRequestID column already exists.';
END
GO

-- =============================================
-- Step 3: Add Foreign Key to MedicationRequests
-- =============================================
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'FK_Payments_MedicationRequest'
)
BEGIN
    ALTER TABLE [dbo].[Payments]
    ADD CONSTRAINT [FK_Payments_MedicationRequest] 
        FOREIGN KEY ([MedicationRequestID]) 
        REFERENCES [MedicationRequests]([MedicationRequestID]) 
        ON DELETE NO ACTION;
    
    PRINT '✓ Added foreign key constraint FK_Payments_MedicationRequest.';
END
ELSE
BEGIN
    PRINT '⚠ Foreign key FK_Payments_MedicationRequest already exists.';
END
GO

-- =============================================
-- Step 4: Add Index for Better Performance
-- =============================================
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_Payments_MedicationRequest' 
    AND object_id = OBJECT_ID('Payments')
)
BEGIN
    CREATE INDEX [IX_Payments_MedicationRequest] 
    ON [dbo].[Payments]([MedicationRequestID])
    WHERE [MedicationRequestID] IS NOT NULL;
    
    PRINT '✓ Created index IX_Payments_MedicationRequest.';
END
ELSE
BEGIN
    PRINT '⚠ Index IX_Payments_MedicationRequest already exists.';
END
GO

-- =============================================
-- Step 5: Add Index on Status for Filtering
-- =============================================
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_Payments_Status' 
    AND object_id = OBJECT_ID('Payments')
)
BEGIN
    CREATE INDEX [IX_Payments_Status] 
    ON [dbo].[Payments]([Status]);
    
    PRINT '✓ Created index IX_Payments_Status.';
END
ELSE
BEGIN
    PRINT '⚠ Index IX_Payments_Status already exists.';
END
GO

-- =============================================
-- Step 6: Add Index on PatientID (if not exists)
-- =============================================
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_Payments_Patient' 
    AND object_id = OBJECT_ID('Payments')
)
BEGIN
    CREATE INDEX [IX_Payments_Patient] 
    ON [dbo].[Payments]([PatientID]);
    
    PRINT '✓ Created index IX_Payments_Patient.';
END
ELSE
BEGIN
    PRINT '⚠ Index IX_Payments_Patient already exists.';
END
GO

PRINT '';
PRINT '=============================================';
PRINT '✓ Payments Table Updated Successfully!';
PRINT '=============================================';
PRINT '';

-- =============================================
-- Verification: Display Updated Table Structure
-- =============================================
PRINT '=============================================';
PRINT 'UPDATED PAYMENTS TABLE STRUCTURE';
PRINT '=============================================';
PRINT '';

SELECT 
    COLUMN_NAME AS [Column],
    DATA_TYPE AS [Type],
    CHARACTER_MAXIMUM_LENGTH AS [Length],
    IS_NULLABLE AS [Nullable],
    COLUMN_DEFAULT AS [Default]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Payments'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '=============================================';
PRINT 'FOREIGN KEY RELATIONSHIPS';
PRINT '=============================================';
PRINT '';

SELECT 
    fk.name AS [Constraint Name],
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS [Column],
    OBJECT_NAME(fk.referenced_object_id) AS [References Table],
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS [References Column]
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fc ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'Payments'
ORDER BY fk.name;

PRINT '';
PRINT '=============================================';
PRINT 'INDEXES';
PRINT '=============================================';
PRINT '';

SELECT 
    i.name AS [Index Name],
    i.type_desc AS [Type],
    COL_NAME(ic.object_id, ic.column_id) AS [Column],
    CASE WHEN i.is_unique = 1 THEN 'Yes' ELSE 'No' END AS [Unique]
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE OBJECT_NAME(i.object_id) = 'Payments'
    AND i.name IS NOT NULL
ORDER BY i.name;

PRINT '';
PRINT '=============================================';
PRINT 'EXISTING PAYMENT DATA';
PRINT '=============================================';
PRINT '';

SELECT 
    COUNT(*) AS [Total Payments],
    SUM(CASE WHEN [Status] = 'Completed' THEN 1 ELSE 0 END) AS [Completed],
    SUM(CASE WHEN [Status] = 'Pending' THEN 1 ELSE 0 END) AS [Pending],
    SUM(CASE WHEN [PrescriptionID] IS NOT NULL THEN 1 ELSE 0 END) AS [Prescription Payments],
    SUM(CASE WHEN [MedicationRequestID] IS NOT NULL THEN 1 ELSE 0 END) AS [Medication Request Payments]
FROM [dbo].[Payments];

PRINT '';
PRINT '=============================================';
PRINT 'NOTES:';
PRINT '- Both PrescriptionID and MedicationRequestID can be NULL';
PRINT '- Old payments use PrescriptionID (prescription workflow)';
PRINT '- New payments use MedicationRequestID (request workflow)';
PRINT '- Application logic ensures one is populated';
PRINT '=============================================';
PRINT '';
PRINT '✓ Update Complete! You can now:';
PRINT '  1. Process payments for Medication Requests';
PRINT '  2. Track both Prescription and Request payments';
PRINT '  3. Query payments by either reference type';
PRINT '=============================================';
GO
