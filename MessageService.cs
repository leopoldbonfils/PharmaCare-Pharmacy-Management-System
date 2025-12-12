using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Messages;

namespace PharmaCareSystem.Api.Services
{
    public interface IMessageService
    {
        Task<List<MessageDto>> GetUserMessagesAsync(int userId, bool unreadOnly = false);
        Task<List<MessageThreadDto>> GetMessageThreadsAsync(int userId);
        Task<ConversationDto> GetConversationAsync(int userId, int otherUserId);
        Task<(bool Success, string Message, MessageDto? Data)> SendMessageAsync(SendMessageDto dto, int senderId);
        Task<(bool Success, string Message)> MarkAsReadAsync(int messageId, int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task<List<object>> GetAvailableUsersAsync(int userId, string userRole);
    }

    public class MessageService : IMessageService
    {
        private readonly PharmaCareDbContext _context;
        private readonly IHubContext<Hubs.NotificationHub>? _hubContext;
        private readonly INotificationService? _notificationService;

        public MessageService(
            PharmaCareDbContext context,
            IHubContext<Hubs.NotificationHub>? hubContext = null,
            INotificationService? notificationService = null)
        {
            _context = context;
            _hubContext = hubContext;
            _notificationService = notificationService;
        }

        public async Task<List<MessageDto>> GetUserMessagesAsync(int userId, bool unreadOnly = false)
        {
            var query = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderID == userId || m.ReceiverID == userId);

            if (unreadOnly)
            {
                query = query.Where(m => m.IsRead == false && m.ReceiverID == userId);
            }

            return await query
                .Include(m => m.ReplyToMessage)
                .OrderByDescending(m => m.SentDate)
                .Select(m => new MessageDto
                {
                    MessageID = m.MessageID,
                    SenderID = m.SenderID,
                    SenderName = m.Sender.FirstName + " " + m.Sender.LastName,
                    SenderRole = m.Sender.Role,
                    SenderImageUrl = m.Sender.ProfileImageUrl,
                    ReceiverID = m.ReceiverID,
                    ReceiverName = m.Receiver.FirstName + " " + m.Receiver.LastName,
                    ReceiverRole = m.Receiver.Role,
                    ReceiverImageUrl = m.Receiver.ProfileImageUrl,
                    PrescriptionID = m.PrescriptionID,
                    MessageText = m.MessageText,
                    IsRead = m.IsRead,
                    SentDate = m.SentDate,
                    ReadDate = m.ReadDate,
                    MessageType = m.MessageType,
                    AttachmentUrl = m.AttachmentUrl,
                    AttachmentFileName = m.AttachmentFileName,
                    AttachmentFileType = m.AttachmentFileType,
                    ReplyToMessageID = m.ReplyToMessageID,
                    ReplyToMessageText = m.ReplyToMessageID != null && m.ReplyToMessage != null ? m.ReplyToMessage.MessageText : null,
                    IsFromCurrentUser = m.SenderID == userId
                })
                .ToListAsync();
        }

        public async Task<List<MessageThreadDto>> GetMessageThreadsAsync(int userId)
        {
            var threads = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderID == userId || m.ReceiverID == userId)
                .GroupBy(m => m.SenderID == userId ? m.ReceiverID : m.SenderID)
                .Select(g => new
                {
                    OtherUserID = g.Key,
                    LastMessage = g.OrderByDescending(m => m.SentDate).FirstOrDefault(),
                    UnreadCount = g.Count(m => m.ReceiverID == userId && !m.IsRead)
                })
                .ToListAsync();

            var result = new List<MessageThreadDto>();

            foreach (var thread in threads)
            {
                var otherUser = await _context.Users.FindAsync(thread.OtherUserID);
                if (otherUser == null) continue;

                var messages = await _context.Messages
                    .Include(m => m.Sender)
                    .Include(m => m.Receiver)
                    .Include(m => m.ReplyToMessage)
                    .Where(m => (m.SenderID == userId && m.ReceiverID == thread.OtherUserID) ||
                                (m.ReceiverID == userId && m.SenderID == thread.OtherUserID))
                    .OrderBy(m => m.SentDate)
                    .Select(m => new MessageDto
                    {
                        MessageID = m.MessageID,
                        SenderID = m.SenderID,
                        SenderName = m.Sender.FirstName + " " + m.Sender.LastName,
                        SenderRole = m.Sender.Role,
                        SenderImageUrl = m.Sender.ProfileImageUrl,
                        ReceiverID = m.ReceiverID,
                        ReceiverName = m.Receiver.FirstName + " " + m.Receiver.LastName,
                        ReceiverRole = m.Receiver.Role,
                        ReceiverImageUrl = m.Receiver.ProfileImageUrl,
                        PrescriptionID = m.PrescriptionID,
                        MessageText = m.MessageText,
                        IsRead = m.IsRead,
                        SentDate = m.SentDate,
                        ReadDate = m.ReadDate,
                        MessageType = m.MessageType,
                        AttachmentUrl = m.AttachmentUrl,
                        AttachmentFileName = m.AttachmentFileName,
                        AttachmentFileType = m.AttachmentFileType,
                        ReplyToMessageID = m.ReplyToMessageID,
                        ReplyToMessageText = m.ReplyToMessageID != null && m.ReplyToMessage != null ? m.ReplyToMessage.MessageText : null,
                        IsFromCurrentUser = m.SenderID == userId
                    })
                    .ToListAsync();

                result.Add(new MessageThreadDto
                {
                    OtherUserID = thread.OtherUserID,
                    OtherUserName = otherUser.FirstName + " " + otherUser.LastName,
                    OtherUserRole = otherUser.Role,
                    OtherUserImageUrl = otherUser.ProfileImageUrl,
                    UnreadCount = thread.UnreadCount,
                    LastMessage = thread.LastMessage?.MessageText,
                    LastMessageDate = thread.LastMessage?.SentDate,
                    Messages = messages
                });
            }

            return result.OrderByDescending(t => t.LastMessageDate).ToList();
        }

        public async Task<ConversationDto> GetConversationAsync(int userId, int otherUserId)
        {
            var otherUser = await _context.Users.FindAsync(otherUserId);
            if (otherUser == null)
            {
                throw new Exception("User not found");
            }

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.ReplyToMessage)
                .Where(m => (m.SenderID == userId && m.ReceiverID == otherUserId) ||
                            (m.ReceiverID == userId && m.SenderID == otherUserId))
                .OrderBy(m => m.SentDate)
                .Select(m => new MessageDto
                {
                    MessageID = m.MessageID,
                    SenderID = m.SenderID,
                    SenderName = m.Sender.FirstName + " " + m.Sender.LastName,
                    SenderRole = m.Sender.Role,
                    SenderImageUrl = m.Sender.ProfileImageUrl,
                    ReceiverID = m.ReceiverID,
                    ReceiverName = m.Receiver.FirstName + " " + m.Receiver.LastName,
                    ReceiverRole = m.Receiver.Role,
                    ReceiverImageUrl = m.Receiver.ProfileImageUrl,
                    PrescriptionID = m.PrescriptionID,
                    MessageText = m.MessageText,
                    IsRead = m.IsRead,
                    SentDate = m.SentDate,
                    ReadDate = m.ReadDate,
                    MessageType = m.MessageType,
                    AttachmentUrl = m.AttachmentUrl,
                    AttachmentFileName = m.AttachmentFileName,
                    AttachmentFileType = m.AttachmentFileType,
                    ReplyToMessageID = m.ReplyToMessageID,
                    ReplyToMessageText = m.ReplyToMessageID != null && m.ReplyToMessage != null ? m.ReplyToMessage.MessageText : null,
                    IsFromCurrentUser = m.SenderID == userId
                })
                .ToListAsync();

            var unreadCount = messages.Count(m => !m.IsRead && m.ReceiverID == userId);

            return new ConversationDto
            {
                OtherUserID = otherUserId,
                OtherUserName = otherUser.FirstName + " " + otherUser.LastName,
                OtherUserRole = otherUser.Role,
                OtherUserImageUrl = otherUser.ProfileImageUrl,
                Messages = messages,
                UnreadCount = unreadCount
            };
        }

        public async Task<(bool Success, string Message, MessageDto? Data)> SendMessageAsync(SendMessageDto dto, int senderId)
        {
            try
            {
                var receiverUser = await _context.Users.FindAsync(dto.ReceiverID);
                if (receiverUser == null || !receiverUser.IsActive)
                {
                    return (false, "Receiver not found or inactive.", null);
                }

                if (senderId == dto.ReceiverID)
                {
                    return (false, "Cannot send message to yourself.", null);
                }

                if (dto.PrescriptionID.HasValue)
                {
                    var prescription = await _context.Prescriptions.FindAsync(dto.PrescriptionID.Value);
                    if (prescription == null)
                    {
                        return (false, "Prescription not found.", null);
                    }
                }

                var validTypes = new[] { "General", "Prescription", "SideEffect", "Dosage", "Emergency" };
                if (!validTypes.Contains(dto.MessageType))
                {
                    dto.MessageType = "General";
                }

                var message = new Message
                {
                    SenderID = senderId,
                    ReceiverID = dto.ReceiverID,
                    PrescriptionID = dto.PrescriptionID,
                    MessageText = dto.MessageText.Trim(),
                    MessageType = dto.MessageType,
                    AttachmentUrl = dto.AttachmentUrl,
                    ReplyToMessageID = dto.ReplyToMessageID,
                    IsRead = false,
                    SentDate = DateTime.Now
                };

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                var savedMessage = await _context.Messages
                    .OrderByDescending(m => m.MessageID)
                    .FirstOrDefaultAsync(m => 
                        m.SenderID == senderId && 
                        m.ReceiverID == dto.ReceiverID && 
                        m.MessageText == message.MessageText &&
                        m.SentDate >= DateTime.Now.AddSeconds(-5));

                if (savedMessage == null)
                {
                    Console.WriteLine("❌ ERROR: Could not retrieve saved message from database");
                    return (false, "Message was saved but could not be retrieved.", null);
                }

                Console.WriteLine($"✅ Message saved successfully with ID: {savedMessage.MessageID}");

                var result = await _context.Messages
                    .Include(m => m.Sender)
                    .Include(m => m.Receiver)
                    .Include(m => m.ReplyToMessage)
                    .Where(m => m.MessageID == savedMessage.MessageID)
                    .Select(m => new MessageDto
                    {
                        MessageID = m.MessageID,
                        SenderID = m.SenderID,
                        SenderName = m.Sender.FirstName + " " + m.Sender.LastName,
                        SenderRole = m.Sender.Role,
                        SenderImageUrl = m.Sender.ProfileImageUrl,
                        ReceiverID = m.ReceiverID,
                        ReceiverName = m.Receiver.FirstName + " " + m.Receiver.LastName,
                        ReceiverRole = m.Receiver.Role,
                        ReceiverImageUrl = m.Receiver.ProfileImageUrl,
                        PrescriptionID = m.PrescriptionID,
                        MessageText = m.MessageText,
                        IsRead = m.IsRead,
                        SentDate = m.SentDate,
                        ReadDate = m.ReadDate,
                        MessageType = m.MessageType,
                        AttachmentUrl = m.AttachmentUrl,
                        AttachmentFileName = m.AttachmentFileName,
                        AttachmentFileType = m.AttachmentFileType,
                        ReplyToMessageID = m.ReplyToMessageID,
                        ReplyToMessageText = m.ReplyToMessageID != null && m.ReplyToMessage != null ? m.ReplyToMessage.MessageText : null,
                        IsFromCurrentUser = true
                    })
                    .FirstOrDefaultAsync();

                if (result == null)
                {
                    Console.WriteLine("❌ ERROR: Could not fetch message details");
                    return (false, "Message saved but details could not be retrieved.", null);
                }

                var senderUser = await _context.Users.FindAsync(senderId);
                if (senderUser != null && _hubContext != null)
                {
                    var messagePreview = result.MessageText.Length > 100 
                        ? result.MessageText.Substring(0, 100) + "..." 
                        : result.MessageText;

                    await _hubContext.Clients.Group($"user_{dto.ReceiverID}").SendAsync("NewMessage", new
                    {
                        MessageID = result.MessageID,
                        SenderID = senderId,
                        SenderName = senderUser.FirstName + " " + senderUser.LastName,
                        MessagePreview = messagePreview,
                        Timestamp = DateTime.Now
                    });
                }

                if (receiverUser != null && senderUser != null && _notificationService != null)
                {
                    if (string.Equals(senderUser.Role, "Patient", StringComparison.OrdinalIgnoreCase) &&
                        string.Equals(receiverUser.Role, "Pharmacist", StringComparison.OrdinalIgnoreCase))
                    {
                        var messagePreview = result.MessageText.Length > 50 
                            ? result.MessageText.Substring(0, 50) + "..." 
                            : result.MessageText;
                        
                        await _notificationService.CreateNotificationAsync(
                            dto.ReceiverID,
                            "New Message",
                            $"{senderUser.FirstName} {senderUser.LastName} sent you a message: {messagePreview}",
                            "Info",
                            "Message",
                            result.MessageID,
                            null,
                            "/messages"
                        );
                    }
                }

                return (true, "Message sent successfully", result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error sending message: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                if (ex.Message.Contains("trigger") || ex.Message.Contains("OUTPUT") || ex.InnerException?.Message.Contains("trigger") == true)
                {
                    Console.WriteLine("❌ DATABASE TRIGGER ERROR DETECTED!");
                    return (false, "Failed to save changes due to database triggers. The interceptor should have handled this. Please ensure TriggerSaveChangesInterceptor is properly registered.", null);
                }
                
                return (false, $"Failed to send message: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> MarkAsReadAsync(int messageId, int userId)
        {
            try
            {
                var message = await _context.Messages
                    .FirstOrDefaultAsync(m => m.MessageID == messageId && m.ReceiverID == userId);

                if (message == null)
                {
                    return (false, "Message not found or you are not the receiver.");
                }

                if (!message.IsRead)
                {
                    message.IsRead = true;
                    message.ReadDate = DateTime.Now;
                    await _context.SaveChangesAsync();
                }

                return (true, "Message marked as read");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to mark message as read: {ex.Message}");
            }
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Messages
                .CountAsync(m => m.ReceiverID == userId && !m.IsRead);
        }

        public async Task<List<object>> GetAvailableUsersAsync(int userId, string userRole)
        {
            try
            {
                Console.WriteLine($"🔍 GetAvailableUsersAsync called - UserID: {userId}, Role: {userRole}");
                
                var normalizedRole = userRole?.Trim().ToLower() ?? "";
                
                if (normalizedRole == "patient")
                {
                    Console.WriteLine("👤 Getting users for Patient role");
                    var users = await _context.Users
                        .Where(u => u.UserID != userId 
                            && u.IsActive == true
                            && u.Role != null
                            && (u.Role.ToLower() == "pharmacist" || u.Role.ToLower() == "administrator"))
                        .ToListAsync();

                    Console.WriteLine($"✅ Found {users.Count} pharmacists/admins");

                    return users.Select(u => new
                    {
                        userID = u.UserID,
                        firstName = u.FirstName ?? "",
                        lastName = u.LastName ?? "",
                        fullName = (u.FirstName ?? "") + " " + (u.LastName ?? ""),
                        role = u.Role ?? "",
                        profileImageUrl = u.ProfileImageUrl,
                        email = u.Email ?? ""
                    }).Cast<object>().ToList();
                }
                else if (normalizedRole == "pharmacist")
                {
                    Console.WriteLine("💊 Getting users for Pharmacist role");
                    
                    var patientIdsFromRequests = await _context.MedicationRequests
                        .Where(mr => mr.PharmacistID == userId)
                        .Select(mr => mr.PatientID)
                        .Distinct()
                        .ToListAsync();

                    Console.WriteLine($"📋 Found {patientIdsFromRequests.Count} patients from medication requests");

                    var patientUserIds = await _context.Patients
                        .Where(p => patientIdsFromRequests.Contains(p.PatientID) && p.UserID.HasValue)
                        .Select(p => p.UserID!.Value)
                        .ToListAsync();

                    Console.WriteLine($"👥 Found {patientUserIds.Count} patient user IDs");

                    var adminIds = await _context.Users
                        .Where(u => u.Role != null 
                            && u.Role.ToLower() == "administrator" 
                            && u.IsActive == true)
                        .Select(u => u.UserID)
                        .ToListAsync();

                    Console.WriteLine($"👨‍💼 Found {adminIds.Count} administrators");

                    var allowedUserIds = patientUserIds.Union(adminIds).Distinct().ToList();

                    if (!allowedUserIds.Any())
                    {
                        Console.WriteLine("⚠️ No assigned patients found, returning only admins");
                        allowedUserIds = adminIds;
                    }

                    var availableUsers = await _context.Users
                        .Where(u => allowedUserIds.Contains(u.UserID) && u.IsActive == true)
                        .ToListAsync();

                    Console.WriteLine($"✅ Returning {availableUsers.Count} available users");

                    return availableUsers.Select(u => new
                    {
                        userID = u.UserID,
                        firstName = u.FirstName ?? "",
                        lastName = u.LastName ?? "",
                        fullName = (u.FirstName ?? "") + " " + (u.LastName ?? ""),
                        role = u.Role ?? "",
                        profileImageUrl = u.ProfileImageUrl,
                        email = u.Email ?? ""
                    }).OrderBy(u => u.fullName).Cast<object>().ToList();
                }
                else
                {
                    Console.WriteLine("👨‍💼 Getting users for Administrator role");
                    var allUsers = await _context.Users
                        .Where(u => u.UserID != userId && u.IsActive == true)
                        .ToListAsync();

                    Console.WriteLine($"✅ Found {allUsers.Count} active users");

                    return allUsers.Select(u => new
                    {
                        userID = u.UserID,
                        firstName = u.FirstName ?? "",
                        lastName = u.LastName ?? "",
                        fullName = (u.FirstName ?? "") + " " + (u.LastName ?? ""),
                        role = u.Role ?? "",
                        profileImageUrl = u.ProfileImageUrl,
                        email = u.Email ?? ""
                    }).OrderBy(u => u.fullName).Cast<object>().ToList();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ CRITICAL Error in GetAvailableUsersAsync:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return new List<object>();
            }
        }
    }
}