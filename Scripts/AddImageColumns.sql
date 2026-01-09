-- =============================================
-- Script to add ProfileImageUrl and PrescriptionImageUrl columns
-- Run this script in SQL Server Management Studio against PharmaCareDB
-- =============================================

USE [PharmaCareDB]
GO

-- Add ProfileImageUrl column to Users table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Users]') 
    AND name = 'ProfileImageUrl'
)
BEGIN
    ALTER TABLE [dbo].[Users]
    ADD [ProfileImageUrl] NVARCHAR(500) NULL;
    PRINT 'Added ProfileImageUrl column to Users table';
END
ELSE
BEGIN
    PRINT 'ProfileImageUrl column already exists in Users table';
END
GO

-- Add PrescriptionImageUrl column to Prescriptions table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Prescriptions]') 
    AND name = 'PrescriptionImageUrl'
)
BEGIN
    ALTER TABLE [dbo].[Prescriptions]
    ADD [PrescriptionImageUrl] NVARCHAR(500) NULL;
    PRINT 'Added PrescriptionImageUrl column to Prescriptions table';
END
ELSE
BEGIN
    PRINT 'PrescriptionImageUrl column already exists in Prescriptions table';
END
GO

PRINT 'Migration completed successfully!';
GO

