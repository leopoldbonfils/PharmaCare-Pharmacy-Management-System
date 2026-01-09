-- =============================================
-- Migration: 012_create_messages_table.sql
-- Description: Creates the Messages table
-- Dependencies: Users (FK: SenderID, ReceiverID), Prescriptions (FK: PrescriptionID)
-- Supports self-referential relationship for message replies
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating Messages Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.Messages', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing Messages table...';
    -- Drop foreign key constraint on self-reference first
    ALTER TABLE [dbo].[Messages] DROP CONSTRAINT IF EXISTS [FK_Messages_Messages_ReplyTo];
    DROP TABLE [dbo].[Messages];
END
GO

-- Create Messages table
CREATE TABLE [dbo].[Messages] (
    [MessageID] INT IDENTITY(1,1) NOT NULL,
    [SenderID] INT NOT NULL,
    [ReceiverID] INT NOT NULL,
    [PrescriptionID] INT NULL,
    [MessageText] NVARCHAR(MAX) NOT NULL,
    [IsRead] BIT NOT NULL DEFAULT 0,
    [SentDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [ReadDate] DATETIME2 NULL,
    [MessageType] NVARCHAR(20) NOT NULL DEFAULT 'General',
    [ReplyToMessageID] INT NULL,
    [AttachmentUrl] NVARCHAR(500) NULL,
    [AttachmentFileName] NVARCHAR(255) NULL,
    [AttachmentFileType] NVARCHAR(50) NULL,
    CONSTRAINT [PK_Messages] PRIMARY KEY CLUSTERED ([MessageID] ASC),
    CONSTRAINT [FK_Messages_Users_Sender] FOREIGN KEY ([SenderID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_Messages_Users_Receiver] FOREIGN KEY ([ReceiverID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_Messages_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE SET NULL,
    CONSTRAINT [FK_Messages_Messages_ReplyTo] FOREIGN KEY ([ReplyToMessageID]) 
        REFERENCES [dbo].[Messages] ([MessageID]) 
        ON DELETE NO ACTION
)
GO

-- Create indexes for better query performance
CREATE NONCLUSTERED INDEX [IX_Messages_SenderID] ON [dbo].[Messages] ([SenderID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Messages_ReceiverID] ON [dbo].[Messages] ([ReceiverID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Messages_PrescriptionID] ON [dbo].[Messages] ([PrescriptionID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Messages_ReplyToMessageID] ON [dbo].[Messages] ([ReplyToMessageID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Messages_IsRead] ON [dbo].[Messages] ([IsRead] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Messages_SentDate] ON [dbo].[Messages] ([SentDate] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Messages_ReceiverID_IsRead] ON [dbo].[Messages] ([ReceiverID] ASC, [IsRead] ASC)
GO

PRINT 'Messages table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[Messages];
-- =============================================

