using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Messages
{
    public class MessageDto
    {
        public int MessageID { get; set; }
        public int SenderID { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string SenderRole { get; set; } = string.Empty;
        public string? SenderImageUrl { get; set; }
        public int ReceiverID { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverRole { get; set; } = string.Empty;
        public string? ReceiverImageUrl { get; set; }
        public int? PrescriptionID { get; set; }
        public string MessageText { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime SentDate { get; set; }
        public DateTime? ReadDate { get; set; }
        public string MessageType { get; set; } = "General";
        public bool IsFromCurrentUser { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? AttachmentFileName { get; set; }
        public string? AttachmentFileType { get; set; }
        public int? ReplyToMessageID { get; set; }
        public string? ReplyToMessageText { get; set; }
    }

    public class SendMessageDto
    {
        [Required]
        public int ReceiverID { get; set; }

        public int? PrescriptionID { get; set; }

        [Required]
        [StringLength(5000, MinimumLength = 1)]
        public string MessageText { get; set; } = string.Empty;

        [StringLength(20)]
        public string MessageType { get; set; } = "General";
        
        public string? AttachmentUrl { get; set; }
        public int? ReplyToMessageID { get; set; }
    }

    public class MessageThreadDto
    {
        public int OtherUserID { get; set; }
        public string OtherUserName { get; set; } = string.Empty;
        public string OtherUserRole { get; set; } = string.Empty;
        public string? OtherUserImageUrl { get; set; }
        public int UnreadCount { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageDate { get; set; }
        public List<MessageDto> Messages { get; set; } = new();
    }

    public class ConversationDto
    {
        public int OtherUserID { get; set; }
        public string OtherUserName { get; set; } = string.Empty;
        public string OtherUserRole { get; set; } = string.Empty;
        public string? OtherUserImageUrl { get; set; }
        public List<MessageDto> Messages { get; set; } = new();
        public int UnreadCount { get; set; }
    }
}

