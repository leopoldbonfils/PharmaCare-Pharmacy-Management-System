-- Add Payment Fields to Sale Table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') AND name = 'PaymentReference')
BEGIN
    ALTER TABLE [dbo].[Sales]
    ADD PaymentReference VARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') AND name = 'PaymentDate')
BEGIN
    ALTER TABLE [dbo].[Sales]
    ADD PaymentDate DATETIME NULL;
END
GO

-- Create Notifications Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE [dbo].[Notifications] (
        [NotificationID] INT IDENTITY(1,1) PRIMARY KEY,
        [UserID] INT NOT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Message] NVARCHAR(1000) NOT NULL,
        [Type] NVARCHAR(50) NOT NULL,
        [RelatedEntityType] NVARCHAR(50) NULL,
        [RelatedEntityID] INT NULL,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID]) ON DELETE CASCADE
    );
    
    CREATE INDEX [IX_Notifications_UserID] ON [dbo].[Notifications]([UserID]);
    CREATE INDEX [IX_Notifications_IsRead] ON [dbo].[Notifications]([IsRead]);
    CREATE INDEX [IX_Notifications_CreatedDate] ON [dbo].[Notifications]([CreatedDate]);
END
GO

PRINT 'Migration completed successfully!';
GO

