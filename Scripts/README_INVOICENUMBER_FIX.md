# InvoiceNumber Error Fix

## Problem
Error 271: "The column 'InvoiceNumber' cannot be modified because it is either a computed column or is the result of a UNION operator."

This error occurs when trying to create a sale because the database has `InvoiceNumber` configured as a computed column, but the application is trying to set it.

## Solution

### Option 1: Fix the Database (Recommended)
Run the script `FixInvoiceNumberColumn.sql` to remove the computed property from the `InvoiceNumber` column:

```sql
-- Run this script in SQL Server Management Studio
USE PharmaCareDB;
GO

-- Execute the script: Scripts/FixInvoiceNumberColumn.sql
```

This will:
1. Remove the computed property from InvoiceNumber
2. Recreate it as a regular column
3. Allow the application to set InvoiceNumber directly

### Option 2: Code Already Handles It
The `SaleService.cs` has been updated to handle this error:
1. Sets InvoiceNumber to empty string initially
2. Marks it as "not modified" so EF Core excludes it from INSERT
3. Saves the sale
4. Updates InvoiceNumber using raw SQL
5. If update fails (because it's computed), reloads to get DB-generated value

## Stock Updates
✅ Stock is updated correctly after checkout:
- Stock quantity is reduced for each medicine sold
- `LastUpdated` timestamp is set
- All changes are saved atomically in a single transaction

## Testing
After applying the fix:
1. Try creating a sale through the POS system
2. Verify that InvoiceNumber is set correctly
3. Verify that medicine stock is reduced
4. Check that the sale appears in the Sales page

