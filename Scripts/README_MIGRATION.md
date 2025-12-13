# ⚠️ CRITICAL: Database Migration Required

## The Error You're Seeing

```
Cannot insert the value NULL into column 'PrescriptionID', table 'PharmaCareDB.dbo.Payments'; column does not allow nulls.
```

**This error happens because the database column `PrescriptionID` is NOT NULL, but we're trying to insert NULL for medication request payments.**

## ✅ SOLUTION: Run This SQL Script NOW

**You MUST run this script before payments will work:**

### Quick Fix Script (Recommended)
**File:** `FixPaymentsTablePrescriptionID.sql`

This script:
- ✅ Makes `PrescriptionID` nullable
- ✅ Handles foreign key constraints properly
- ✅ Works even if constraints already exist

### Full Migration Script
**File:** `UpdatePaymentsTableForMedicationRequests.sql`

This script does everything:
- ✅ Makes `PrescriptionID` nullable
- ✅ Adds `MedicationRequestID` column
- ✅ Creates indexes
- ✅ Sets up foreign keys

## 🚀 How to Run

1. **Open SQL Server Management Studio (SSMS)**
2. **Connect to your database:** `PharmaCareDB`
3. **Open the script file:**
   - For quick fix: `FixPaymentsTablePrescriptionID.sql`
   - For full migration: `UpdatePaymentsTableForMedicationRequests.sql`
4. **Execute the script** (F5 or Execute button)
5. **Verify:** You should see "✓ SUCCESS" messages

## ✅ After Running the Script

- ✅ Payments for medication requests will work
- ✅ "Pay Now" button will work
- ✅ No more NULL insertion errors
- ✅ Payment history will show correctly

## 🔍 Verify It Worked

Run this query to check:

```sql
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Payments' 
AND COLUMN_NAME IN ('PrescriptionID', 'MedicationRequestID');
```

**Expected Result:**
- `PrescriptionID` → `IS_NULLABLE = YES`
- `MedicationRequestID` → `IS_NULLABLE = YES`

## ⚠️ If You Still See Errors

1. Make sure you ran the script in the correct database (`PharmaCareDB`)
2. Check that the script completed successfully (no errors in Messages tab)
3. Restart your backend API (`dotnet run`)
4. Try creating a payment again

---

**The backend code is already correct. The ONLY issue is the database schema needs to be updated.**
