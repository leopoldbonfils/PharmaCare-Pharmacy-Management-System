-- =============================================
-- Fix InvoiceNumber Computed Column Issue
-- If InvoiceNumber is a computed column, we need to remove it
-- =============================================
USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Checking InvoiceNumber Column...';
PRINT '=============================================';
PRINT '';

-- Check if InvoiceNumber is computed
DECLARE @IsComputed BIT = 0;
SELECT @IsComputed = CASE WHEN is_computed = 1 THEN 1 ELSE 0 END
FROM sys.columns
WHERE object_id = OBJECT_ID('Sales')
AND name = 'InvoiceNumber';

IF @IsComputed = 1
BEGIN
    PRINT '⚠ InvoiceNumber is a computed column.';
    PRINT 'Removing computed property...';
    
    -- Get the current definition to preserve it if needed
    DECLARE @Definition NVARCHAR(MAX);
    SELECT @Definition = definition
    FROM sys.computed_columns
    WHERE object_id = OBJECT_ID('Sales')
    AND name = 'InvoiceNumber';
    
    PRINT 'Current definition: ' + @Definition;
    PRINT '';
    PRINT '⚠ WARNING: If InvoiceNumber is computed, you may need to:';
    PRINT '   1. Drop the computed column';
    PRINT '   2. Recreate it as a regular column';
    PRINT '   3. Or use a trigger to generate it';
    PRINT '';
    PRINT 'For now, the application will generate InvoiceNumber in code.';
    PRINT 'If you want to keep it computed, you need to configure EF Core to ignore it on insert.';
END
ELSE
BEGIN
    PRINT '✓ InvoiceNumber is NOT a computed column - OK';
    PRINT 'The application can set InvoiceNumber directly.';
END

-- Verify column properties
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Sales'
AND COLUMN_NAME = 'InvoiceNumber';

PRINT '';
PRINT '=============================================';
PRINT 'Check Complete!';
PRINT '=============================================';
GO

