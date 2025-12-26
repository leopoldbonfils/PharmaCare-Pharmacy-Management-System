using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class Message
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MessageID { get; set; }

        [Required]
        [ForeignKey("Sender")]
        public int SenderID { get; set; }

        [Required]
        [ForeignKey("Receiver")]
        public int ReceiverID { get; set; }

        [ForeignKey("Prescription")]
        public int? PrescriptionID { get; set; }

        [Required]
        [Column(TypeName = "NVARCHAR(MAX)")]
        public string MessageText { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime SentDate { get; set; } = DateTime.Now;

        public DateTime? ReadDate { get; set; }

        [StringLength(20)]
        public string MessageType { get; set; } = "General"; // General, Prescription, SideEffect, Dosage, Emergency

        [Column("ReplyToMessageID")]
        public int? ReplyToMessageID { get; set; }

        [Column("AttachmentUrl")]
        [StringLength(500)]
        public string? AttachmentUrl { get; set; }

        [Column("AttachmentFileName")]
        [StringLength(255)]
        public string? AttachmentFileName { get; set; }

        [Column("AttachmentFileType")]
        [StringLength(50)]
        public string? AttachmentFileType { get; set; }

        // Navigation Properties
        public virtual User Sender { get; set; } = null!;
        public virtual User Receiver { get; set; } = null!;
        public virtual Prescription? Prescription { get; set; }
        public virtual Message? ReplyToMessage { get; set; }
    }
}

