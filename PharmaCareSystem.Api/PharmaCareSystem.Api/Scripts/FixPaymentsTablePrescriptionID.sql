-- =============================================
-- CRITICAL FIX: Make PrescriptionID Nullable
-- This MUST be run before medication request payments will work
-- =============================================
USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'FIXING PrescriptionID to be NULLABLE';
PRINT '=============================================';
PRINT '';

-- Check current state
DECLARE @IsNullable BIT;
SELECT @IsNullable = is_nullable 
FROM sys.columns 
WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') 
AND name = 'PrescriptionID';

IF @IsNullable = 0
BEGIN
    PRINT 'Current state: PrescriptionID is NOT NULL';
    PRINT 'Fixing...';
    PRINT '';
    
    -- Find and drop all foreign keys on PrescriptionID
    DECLARE @SQL NVARCHAR(MAX) = '';
    DECLARE @FKName NVARCHAR(255);
    
    DECLARE FK_Cursor CURSOR FOR
    SELECT fk.name
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fc ON fk.object_id = fc.constraint_object_id
    WHERE OBJECT_NAME(fc.parent_object_id) = 'Payments'
    AND COL_NAME(fc.parent_object_id, fc.parent_column_id) = 'PrescriptionID';
    
    OPEN FK_Cursor;
    FETCH NEXT FROM FK_Cursor INTO @FKName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [dbo].[Payments] DROP CONSTRAINT [' + @FKName + '];';
        EXEC sp_executesql @SQL;
        PRINT '✓ Dropped constraint: ' + @FKName;
        FETCH NEXT FROM FK_Cursor INTO @FKName;
    END
    
    CLOSE FK_Cursor;
    DEALLOCATE FK_Cursor;
    
    -- Now make the column nullable
    ALTER TABLE [dbo].[Payments]
    ALTER COLUMN [PrescriptionID] INT NULL;
    
    PRINT '';
    PRINT '✓ SUCCESS: PrescriptionID is now NULLABLE';
    PRINT '';
    
    -- Recreate the foreign key
    IF NOT EXISTS (
        SELECT * FROM sys.foreign_keys 
        WHERE name = 'FK_Payments_Prescription'
    )
    BEGIN
        ALTER TABLE [dbo].[Payments]
        ADD CONSTRAINT [FK_Payments_Prescription] 
            FOREIGN KEY ([PrescriptionID]) 
            REFERENCES [Prescriptions]([PrescriptionID]) 
            ON DELETE NO ACTION;
        PRINT '✓ Recreated foreign key: FK_Payments_Prescription';
    END
END
ELSE
BEGIN
    PRINT '✓ PrescriptionID is already NULLABLE - No changes needed';
END

-- Verify
SELECT 
    COLUMN_NAME AS [Column],
    IS_NULLABLE AS [Is Nullable],
    DATA_TYPE AS [Type]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Payments' 
AND COLUMN_NAME = 'PrescriptionID';

PRINT '';
PRINT '=============================================';
PRINT 'FIX COMPLETE!';
PRINT 'You can now create payments for medication requests.';
PRINT '=============================================';
GO

