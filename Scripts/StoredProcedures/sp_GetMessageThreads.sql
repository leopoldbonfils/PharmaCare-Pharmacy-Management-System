-- =============================================
-- Stored Procedure: sp_GetMessageThreads
-- Description: Retrieves message threads/conversations for a specific user
-- Parameters: @UserID - The ID of the user to get threads for
-- =============================================

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

PRINT 'Stored procedure sp_GetMessageThreads created successfully!';
GO

