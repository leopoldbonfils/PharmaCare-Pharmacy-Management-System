-- =============================================
-- Migration: 001_create_users_table.sql
-- Description: Creates the Users table
-- Dependencies: None (base table)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating Users Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing Users table...';
    DROP TABLE [dbo].[Users];
END
GO

-- Create Users table
CREATE TABLE [dbo].[Users] (
    [UserID] INT IDENTITY(1,1) NOT NULL,
    [Username] NVARCHAR(50) NOT NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [Email] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(20) NOT NULL,
    [FirstName] NVARCHAR(50) NOT NULL,
    [LastName] NVARCHAR(50) NOT NULL,
    [PhoneNumber] NVARCHAR(20) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [LastLoginDate] DATETIME2 NULL,
    [ProfileImageUrl] NVARCHAR(500) NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([UserID] ASC)
)
GO

-- Create unique indexes
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Username] ON [dbo].[Users] ([Username] ASC)
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Email] ON [dbo].[Users] ([Email] ASC)
GO

-- Create index on Role for filtering
CREATE NONCLUSTERED INDEX [IX_Users_Role] ON [dbo].[Users] ([Role] ASC)
GO

-- Create index on IsActive for filtering
CREATE NONCLUSTERED INDEX [IX_Users_IsActive] ON [dbo].[Users] ([IsActive] ASC)
GO

PRINT 'Users table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[Users];
-- =============================================

