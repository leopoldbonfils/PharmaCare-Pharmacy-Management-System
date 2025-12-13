using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Payments
{
    public class PaymentDto
    {
        public int PaymentID { get; set; }
        public int PatientID { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int? PrescriptionID { get; set; }
        public int? MedicationRequestID { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string? TransactionRef { get; set; }
        public string? PaymentDetails { get; set; }
        public DateTime PaymentDate { get; set; }
        public DateTime? CompletedDate { get; set; }
    }

    public class CreatePaymentDto
    {
        public int? PrescriptionID { get; set; } // Optional - for prescription payments
        public int? MedicationRequestID { get; set; } // Optional - for medication request payments
        [Required]
        [StringLength(50)]
        public string Method { get; set; } = string.Empty; // MTN_MoMo, Airtel_Money, Credit_Card, Cash
        [StringLength(100)]
        public string? TransactionRef { get; set; }
        [StringLength(500)]
        public string? PaymentDetails { get; set; }
    }

    public class PaymentStatusDto
    {
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty; // Pending, Completed, Failed, Refunded
        [StringLength(100)]
        public string? TransactionRef { get; set; }
    }
}

