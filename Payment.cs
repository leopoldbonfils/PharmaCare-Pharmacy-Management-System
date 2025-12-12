using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentID { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public int PatientID { get; set; }

        [ForeignKey("Prescription")]
        public int? PrescriptionID { get; set; } // Optional - can pay for prescription or medication request

        [ForeignKey("MedicationRequest")]
        public int? MedicationRequestID { get; set; } // Optional - for direct medication request payments

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Completed, Failed, Refunded

        [Required]
        [StringLength(50)]
        public string Method { get; set; } = string.Empty; // MTN_MoMo, Airtel_Money, Credit_Card, Cash

        [StringLength(100)]
        public string? TransactionRef { get; set; }

        [StringLength(500)]
        public string? PaymentDetails { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.Now;

        public DateTime? CompletedDate { get; set; }

        // Navigation Properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual Prescription? Prescription { get; set; }
        public virtual MedicationRequest? MedicationRequest { get; set; }
    }
}

