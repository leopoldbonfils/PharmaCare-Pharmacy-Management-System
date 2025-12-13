-- =============================================
-- PharmaCare Messaging System Database Setup
-- FIXED: Cascade delete conflict resolved
-- =============================================

-- 1. Create Messages Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
BEGIN
    CREATE TABLE [dbo].[Messages] (
        [MessageID] INT IDENTITY(1,1) PRIMARY KEY,
        [SenderID] INT NOT NULL,
        [ReceiverID] INT NOT NULL,
        [PrescriptionID] INT NULL,
        [MessageText] NVARCHAR(MAX) NOT NULL,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [SentDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [ReadDate] DATETIME NULL,
        [MessageType] NVARCHAR(20) DEFAULT 'General' CHECK ([MessageType] IN ('General', 'Prescription', 'SideEffect', 'Dosage', 'Emergency')),
        [ReplyToMessageID] INT NULL,
        [AttachmentUrl] NVARCHAR(500) NULL,
        [AttachmentFileName] NVARCHAR(255) NULL,
        [AttachmentFileType] NVARCHAR(50) NULL,
        
        -- FIX: Changed both foreign keys to NO ACTION to avoid cascade conflict
        CONSTRAINT [FK_Messages_Sender] FOREIGN KEY ([SenderID]) 
            REFERENCES [Users]([UserID]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Messages_Receiver] FOREIGN KEY ([ReceiverID]) 
            REFERENCES [Users]([UserID]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Messages_Prescription] FOREIGN KEY ([PrescriptionID]) 
            REFERENCES [Prescriptions]([PrescriptionID]) ON DELETE SET NULL,
        CONSTRAINT [FK_Messages_ReplyToMessage] FOREIGN KEY ([ReplyToMessageID]) 
            REFERENCES [Messages]([MessageID]) ON DELETE NO ACTION,
        CONSTRAINT [CK_Messages_DifferentUsers] CHECK ([SenderID] != [ReceiverID])
    );
    
    PRINT 'Messages table created successfully.';
END
ELSE
BEGIN
    PRINT 'Messages table already exists.';
END
GO

-- 2. Create Indexes for Messages
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_Sender' AND object_id = OBJECT_ID('Messages'))
BEGIN
    CREATE INDEX [IX_Messages_Sender] ON [dbo].[Messages]([SenderID]);
    PRINT 'Index IX_Messages_Sender created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_Receiver' AND object_id = OBJECT_ID('Messages'))
BEGIN
    CREATE INDEX [IX_Messages_Receiver] ON [dbo].[Messages]([ReceiverID]);
    PRINT 'Index IX_Messages_Receiver created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_Prescription' AND object_id = OBJECT_ID('Messages'))
BEGIN
    CREATE INDEX [IX_Messages_Prescription] ON [dbo].[Messages]([PrescriptionID]) WHERE [PrescriptionID] IS NOT NULL;
    PRINT 'Index IX_Messages_Prescription created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_IsRead' AND object_id = OBJECT_ID('Messages'))
BEGIN
    CREATE INDEX [IX_Messages_IsRead] ON [dbo].[Messages]([IsRead]);
    PRINT 'Index IX_Messages_IsRead created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_SentDate' AND object_id = OBJECT_ID('Messages'))
BEGIN
    CREATE INDEX [IX_Messages_SentDate] ON [dbo].[Messages]([SentDate] DESC);
    PRINT 'Index IX_Messages_SentDate created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_ReplyToMessage' AND object_id = OBJECT_ID('Messages'))
BEGIN
    CREATE INDEX [IX_Messages_ReplyToMessage] ON [dbo].[Messages]([ReplyToMessageID]) WHERE [ReplyToMessageID] IS NOT NULL;
    PRINT 'Index IX_Messages_ReplyToMessage created.';
END
GO

-- 3. Update Notifications Table (if it exists, add missing columns)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    -- Add RelatedID if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND name = 'RelatedID')
    BEGIN
        ALTER TABLE [dbo].[Notifications]
        ADD [RelatedID] INT NULL;
        PRINT 'Added RelatedID column to Notifications table.';
    END
    
    -- Add ReadDate if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND name = 'ReadDate')
    BEGIN
        ALTER TABLE [dbo].[Notifications]
        ADD [ReadDate] DATETIME NULL;
        PRINT 'Added ReadDate column to Notifications table.';
    END
    
    -- Add ActionUrl if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND name = 'ActionUrl')
    BEGIN
        ALTER TABLE [dbo].[Notifications]
        ADD [ActionUrl] NVARCHAR(200) NULL;
        PRINT 'Added ActionUrl column to Notifications table.';
    END
    
    -- Update Type column constraint if needed
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Notifications_Type')
    BEGIN
        ALTER TABLE [dbo].[Notifications] DROP CONSTRAINT [CK_Notifications_Type];
    END
    ALTER TABLE [dbo].[Notifications]
    ADD CONSTRAINT [CK_Notifications_Type] CHECK ([Type] IN ('Message', 'Prescription', 'Payment', 'System', 'Info', 'Success', 'Warning', 'Error'));
    PRINT 'Updated Notifications Type constraint.';
END
ELSE
BEGIN
    -- Create Notifications table if it doesn't exist
    CREATE TABLE [dbo].[Notifications] (
        [NotificationID] INT IDENTITY(1,1) PRIMARY KEY,
        [UserID] INT NOT NULL,
        [Title] NVARCHAR(100) NOT NULL,
        [Message] NVARCHAR(500) NOT NULL,
        [Type] NVARCHAR(20) NOT NULL CHECK ([Type] IN ('Message', 'Prescription', 'Payment', 'System', 'Info', 'Success', 'Warning', 'Error')),
        [RelatedID] INT NULL,
        [RelatedEntityType] NVARCHAR(50) NULL,
        [RelatedEntityID] INT NULL,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [ReadDate] DATETIME NULL,
        [ActionUrl] NVARCHAR(200) NULL,
        
        CONSTRAINT [FK_Notifications_User] FOREIGN KEY ([UserID]) 
            REFERENCES [Users]([UserID]) ON DELETE CASCADE
    );
    PRINT 'Notifications table created successfully.';
END
GO

-- 4. Create Indexes for Notifications (if they don't exist)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_User' AND object_id = OBJECT_ID('Notifications'))
    BEGIN
        CREATE INDEX [IX_Notifications_User] ON [dbo].[Notifications]([UserID]);
        PRINT 'Index IX_Notifications_User created.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_IsRead' AND object_id = OBJECT_ID('Notifications'))
    BEGIN
        CREATE INDEX [IX_Notifications_IsRead] ON [dbo].[Notifications]([IsRead]);
        PRINT 'Index IX_Notifications_IsRead created.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_Type' AND object_id = OBJECT_ID('Notifications'))
    BEGIN
        CREATE INDEX [IX_Notifications_Type] ON [dbo].[Notifications]([Type]);
        PRINT 'Index IX_Notifications_Type created.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_CreatedDate' AND object_id = OBJECT_ID('Notifications'))
    BEGIN
        CREATE INDEX [IX_Notifications_CreatedDate] ON [dbo].[Notifications]([CreatedDate] DESC);
        PRINT 'Index IX_Notifications_CreatedDate created.';
    END
END
GO

-- 5. Create Trigger to Auto-Generate Notifications on New Messages
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Messages_Insert_Notification')
BEGIN
    DROP TRIGGER [dbo].[TR_Messages_Insert_Notification];
END
GO

CREATE TRIGGER [dbo].[TR_Messages_Insert_Notification]
ON [dbo].[Messages]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO [dbo].[Notifications] ([UserID], [Title], [Message], [Type], [RelatedID], [RelatedEntityType], [RelatedEntityID], [ActionUrl])
    SELECT 
        i.[ReceiverID],
        CASE 
            WHEN u.Role = 'Patient' THEN 'New Message from Patient'
            WHEN u.Role = 'Pharmacist' THEN 'New Message from Pharmacist'
            ELSE 'New Message'
        END AS [Title],
        LEFT(i.[MessageText], 100) + CASE WHEN LEN(i.[MessageText]) > 100 THEN '...' ELSE '' END AS [Message],
        'Message' AS [Type],
        i.[MessageID] AS [RelatedID],
        'Message' AS [RelatedEntityType],
        i.[MessageID] AS [RelatedEntityID],
        '/messages' AS [ActionUrl]
    FROM inserted i
    INNER JOIN [Users] u ON u.[UserID] = i.[SenderID];
END
GO

-- 6. Create Stored Procedure: Get User Messages
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetUserMessages')
BEGIN
    DROP PROCEDURE [dbo].[sp_GetUserMessages];
END
GO

CREATE PROCEDURE [dbo].[sp_GetUserMessages]
    @UserID INT,
    @UnreadOnly BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.[MessageID],
        m.[SenderID],
        s.[FirstName] + ' ' + s.[LastName] AS [SenderName],
        s.[Role] AS [SenderRole],
        m.[ReceiverID],
        r.[FirstName] + ' ' + r.[LastName] AS [ReceiverName],
        r.[Role] AS [ReceiverRole],
        m.[PrescriptionID],
        m.[MessageText],
        m.[IsRead],
        m.[SentDate],
        m.[ReadDate],
        m.[MessageType]
    FROM [Messages] m
    INNER JOIN [Users] s ON s.[UserID] = m.[SenderID]
    INNER JOIN [Users] r ON r.[UserID] = m.[ReceiverID]
    WHERE (m.[SenderID] = @UserID OR m.[ReceiverID] = @UserID)
        AND (@UnreadOnly = 0 OR (m.[IsRead] = 0 AND m.[ReceiverID] = @UserID))
    ORDER BY m.[SentDate] DESC;
END
GO

-- 7. Create Stored Procedure: Get Message Threads
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetMessageThreads')
BEGIN
    DROP PROCEDURE [dbo].[sp_GetMessageThreads];
END
GO

CREATE PROCEDURE [dbo].[sp_GetMessageThreads]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        CASE 
            WHEN m.[SenderID] = @UserID THEN m.[ReceiverID]
            ELSE m.[SenderID]
        END AS [OtherUserID],
        CASE 
            WHEN m.[SenderID] = @UserID THEN r.[FirstName] + ' ' + r.[LastName]
            ELSE s.[FirstName] + ' ' + s.[LastName]
        END AS [OtherUserName],
        CASE 
            WHEN m.[SenderID] = @UserID THEN r.[Role]
            ELSE s.[Role]
        END AS [OtherUserRole],
        CASE 
            WHEN m.[SenderID] = @UserID THEN r.[ProfileImageUrl]
            ELSE s.[ProfileImageUrl]
        END AS [OtherUserImage],
        (SELECT COUNT(*) FROM [Messages] WHERE [ReceiverID] = @UserID AND [SenderID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END AND [IsRead] = 0) AS [UnreadCount],
        (SELECT TOP 1 [MessageText] FROM [Messages] WHERE ([SenderID] = @UserID AND [ReceiverID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) OR ([ReceiverID] = @UserID AND [SenderID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) ORDER BY [SentDate] DESC) AS [LastMessage],
        (SELECT TOP 1 [SentDate] FROM [Messages] WHERE ([SenderID] = @UserID AND [ReceiverID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) OR ([ReceiverID] = @UserID AND [SenderID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) ORDER BY [SentDate] DESC) AS [LastMessageDate]
    FROM [Messages] m
    INNER JOIN [Users] s ON s.[UserID] = m.[SenderID]
    INNER JOIN [Users] r ON r.[UserID] = m.[ReceiverID]
    WHERE m.[SenderID] = @UserID OR m.[ReceiverID] = @UserID
    ORDER BY [LastMessageDate] DESC;
END
GO

PRINT '=============================================';
PRINT 'Messaging System Database Setup Complete!';
PRINT '=============================================';
GO