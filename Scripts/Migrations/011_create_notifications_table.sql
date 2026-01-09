-- =============================================
-- Migration: 011_create_notifications_table.sql
-- Description: Creates the Notifications table
-- Dependencies: Users (FK: UserID)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating Notifications Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing Notifications table...';
    DROP TABLE [dbo].[Notifications];
END
GO

-- Create Notifications table
CREATE TABLE [dbo].[Notifications] (
    [NotificationID] INT IDENTITY(1,1) NOT NULL,
    [UserID] INT NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Message] NVARCHAR(1000) NOT NULL,
    [Type] NVARCHAR(50) NOT NULL,
    [RelatedEntityType] NVARCHAR(50) NULL,
    [RelatedEntityID] INT NULL,
    [RelatedID] INT NULL,
    [IsRead] BIT NOT NULL DEFAULT 0,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [ReadDate] DATETIME2 NULL,
    [ActionUrl] NVARCHAR(200) NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE CASCADE
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_Notifications_UserID] ON [dbo].[Notifications] ([UserID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Notifications_IsRead] ON [dbo].[Notifications] ([IsRead] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Notifications_CreatedDate] ON [dbo].[Notifications] ([CreatedDate] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Notifications_UserID_IsRead] ON [dbo].[Notifications] ([UserID] ASC, [IsRead] ASC)
GO

PRINT 'Notifications table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[Notifications];
-- =============================================

