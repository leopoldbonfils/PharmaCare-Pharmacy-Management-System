using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int NotificationID { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // Message, Prescription, Payment, System, Info, Success, Warning, Error

        [StringLength(50)]
        public string? RelatedEntityType { get; set; } // MedicationRequest, Prescription, Payment, Message

        public int? RelatedEntityID { get; set; }

        public int? RelatedID { get; set; } // For backward compatibility and MessageID

        public bool IsRead { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? ReadDate { get; set; }

        [StringLength(200)]
        public string? ActionUrl { get; set; }

        // Navigation Properties
        public virtual User User { get; set; } = null!;
    }
}

