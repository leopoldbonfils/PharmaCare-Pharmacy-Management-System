-- =============================================
-- Fix InvoiceNumber Column - Remove Computed Property
-- This script removes the computed property from InvoiceNumber if it exists
-- =============================================
USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Fixing InvoiceNumber Column...';
PRINT '=============================================';
PRINT '';

-- Check if InvoiceNumber is computed
DECLARE @IsComputed BIT = 0;
DECLARE @ColumnDefinition NVARCHAR(MAX);
DECLARE @HasData BIT = 0;

SELECT @IsComputed = CASE WHEN is_computed = 1 THEN 1 ELSE 0 END,
       @ColumnDefinition = definition
FROM sys.computed_columns
WHERE object_id = OBJECT_ID('Sales')
AND name = 'InvoiceNumber';

SELECT @HasData = CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
FROM [dbo].[Sales];

IF @IsComputed = 1
BEGIN
    PRINT '⚠ InvoiceNumber is currently a computed column.';
    PRINT 'Definition: ' + ISNULL(@ColumnDefinition, 'N/A');
    PRINT '';
    
    IF @HasData = 1
    BEGIN
        PRINT '⚠ Table has existing data. Creating backup column...';
        
        -- Step 1: Add a temporary column to store existing InvoiceNumber values
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'InvoiceNumber_Backup')
        BEGIN
            ALTER TABLE [dbo].[Sales] 
            ADD [InvoiceNumber_Backup] NVARCHAR(50) NULL;
            PRINT '✓ Created backup column';
            
            -- Copy existing computed values to backup
            UPDATE [dbo].[Sales] 
            SET [InvoiceNumber_Backup] = [InvoiceNumber];
            PRINT '✓ Backed up existing InvoiceNumber values';
        END
    END
    
    PRINT '';
    PRINT 'Removing computed property and recreating as regular column...';
    PRINT '';
    
    -- Step 2: Drop the unique index first (if it exists)
    IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Sales') AND name = 'IX_Sales_InvoiceNumber')
    BEGIN
        DROP INDEX [IX_Sales_InvoiceNumber] ON [dbo].[Sales];
        PRINT '✓ Dropped unique index on InvoiceNumber';
    END
    
    IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Sales') AND name = 'UQ_Sales_InvoiceNumber')
    BEGIN
        DROP INDEX [UQ_Sales_InvoiceNumber] ON [dbo].[Sales];
        PRINT '✓ Dropped unique constraint on InvoiceNumber';
    END
    
    -- Step 3: Drop the computed column
    ALTER TABLE [dbo].[Sales] DROP COLUMN [InvoiceNumber];
    PRINT '✓ Dropped computed InvoiceNumber column';
    
    -- Step 4: Add it back as a regular column
    ALTER TABLE [dbo].[Sales] 
    ADD [InvoiceNumber] NVARCHAR(50) NOT NULL DEFAULT('');
    PRINT '✓ Added InvoiceNumber as regular column';
    
    -- Step 5: Restore values from backup if they exist
    IF @HasData = 1 AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'InvoiceNumber_Backup')
    BEGIN
        UPDATE [dbo].[Sales] 
        SET [InvoiceNumber] = ISNULL([InvoiceNumber_Backup], '');
        PRINT '✓ Restored InvoiceNumber values from backup';
        
        -- Drop backup column
        ALTER TABLE [dbo].[Sales] DROP COLUMN [InvoiceNumber_Backup];
        PRINT '✓ Removed backup column';
    END
    
    -- Step 6: Remove the default constraint
    DECLARE @ConstraintName NVARCHAR(200);
    SELECT @ConstraintName = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('Sales') 
    AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Sales'), 'InvoiceNumber', 'ColumnId');
    
    IF @ConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE [dbo].[Sales] DROP CONSTRAINT [' + @ConstraintName + ']');
        PRINT '✓ Removed default constraint';
    END
    
    -- Step 7: Recreate unique index
    CREATE UNIQUE NONCLUSTERED INDEX [IX_Sales_InvoiceNumber] 
    ON [dbo].[Sales] ([InvoiceNumber])
    WHERE [InvoiceNumber] <> '';  -- Allow multiple empty strings during transition
    PRINT '✓ Recreated unique index on InvoiceNumber';
    
    PRINT '';
    PRINT '✓ InvoiceNumber is now a regular column - application can set it directly';
END
ELSE
BEGIN
    PRINT '✓ InvoiceNumber is already a regular column - no changes needed';
    
    -- Ensure it's not nullable and has no default
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Sales' 
               AND COLUMN_NAME = 'InvoiceNumber' 
               AND IS_NULLABLE = 'YES')
    BEGIN
        -- Update any NULL values to empty string first
        UPDATE [dbo].[Sales] SET [InvoiceNumber] = '' WHERE [InvoiceNumber] IS NULL;
        
        ALTER TABLE [dbo].[Sales] 
        ALTER COLUMN [InvoiceNumber] NVARCHAR(50) NOT NULL;
        PRINT '✓ Made InvoiceNumber NOT NULL';
    END
    
    -- Remove default if exists
    DECLARE @DefConstraintName NVARCHAR(200);
    SELECT @DefConstraintName = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('Sales') 
    AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Sales'), 'InvoiceNumber', 'ColumnId');
    
    IF @DefConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE [dbo].[Sales] DROP CONSTRAINT [' + @DefConstraintName + ']');
        PRINT '✓ Removed default constraint';
    END
END

-- Verify the column properties
PRINT '';
PRINT 'Current InvoiceNumber column properties:';
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_DEFAULT,
    CASE 
        WHEN EXISTS (SELECT 1 FROM sys.computed_columns WHERE object_id = OBJECT_ID('Sales') AND name = 'InvoiceNumber') 
        THEN 'Yes' 
        ELSE 'No' 
    END AS IsComputed
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Sales'
AND COLUMN_NAME = 'InvoiceNumber';

PRINT '';
PRINT '=============================================';
PRINT 'Fix Complete!';
PRINT '=============================================';
PRINT '';
PRINT 'The InvoiceNumber column is now a regular column that can be set by the application.';
GO
