-- =============================================
-- Script to add missing columns to existing database
-- Run this script in SQL Server Management Studio against PharmaCareDB
-- =============================================

USE [PharmaCareDB]
GO

PRINT 'Starting database schema update...';
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
    PRINT '✓ Added ProfileImageUrl column to Users table';
END
ELSE
BEGIN
    PRINT '✓ ProfileImageUrl column already exists in Users table';
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
    PRINT '✓ Added PrescriptionImageUrl column to Prescriptions table';
END
ELSE
BEGIN
    PRINT '✓ PrescriptionImageUrl column already exists in Prescriptions table';
END
GO

-- Add ReplyToMessageID column to Messages table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') 
    AND name = 'ReplyToMessageID'
)
BEGIN
    ALTER TABLE [dbo].[Messages]
    ADD [ReplyToMessageID] INT NULL;
    PRINT '✓ Added ReplyToMessageID column to Messages table';
END
ELSE
BEGIN
    PRINT '✓ ReplyToMessageID column already exists in Messages table';
END
GO

-- Add foreign key constraint for ReplyToMessageID if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE name = 'FK_Messages_ReplyToMessage'
)
BEGIN
    ALTER TABLE [dbo].[Messages]
    ADD CONSTRAINT [FK_Messages_ReplyToMessage] FOREIGN KEY ([ReplyToMessageID]) 
        REFERENCES [dbo].[Messages]([MessageID]) ON DELETE NO ACTION;
    PRINT '✓ Added FK_Messages_ReplyToMessage foreign key constraint';
END
ELSE
BEGIN
    PRINT '✓ FK_Messages_ReplyToMessage foreign key constraint already exists';
END
GO

-- Add AttachmentUrl column to Messages table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') 
    AND name = 'AttachmentUrl'
)
BEGIN
    ALTER TABLE [dbo].[Messages]
    ADD [AttachmentUrl] NVARCHAR(500) NULL;
    PRINT '✓ Added AttachmentUrl column to Messages table';
END
ELSE
BEGIN
    PRINT '✓ AttachmentUrl column already exists in Messages table';
END
GO

-- Add AttachmentFileName column to Messages table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') 
    AND name = 'AttachmentFileName'
)
BEGIN
    ALTER TABLE [dbo].[Messages]
    ADD [AttachmentFileName] NVARCHAR(255) NULL;
    PRINT '✓ Added AttachmentFileName column to Messages table';
END
ELSE
BEGIN
    PRINT '✓ AttachmentFileName column already exists in Messages table';
END
GO

-- Add AttachmentFileType column to Messages table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') 
    AND name = 'AttachmentFileType'
)
BEGIN
    ALTER TABLE [dbo].[Messages]
    ADD [AttachmentFileType] NVARCHAR(50) NULL;
    PRINT '✓ Added AttachmentFileType column to Messages table';
END
ELSE
BEGIN
    PRINT '✓ AttachmentFileType column already exists in Messages table';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Database schema update completed!';
PRINT '========================================';
GO

