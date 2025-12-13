using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class Sale
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SaleID { get; set; }

        [Required]
        [StringLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [ForeignKey("Patient")]
        public int? PatientID { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [StringLength(20)]
        public string PaymentMethod { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string PaymentStatus { get; set; } = "Paid";

        [Required]
        [ForeignKey("SoldByUser")]
        public int SoldBy { get; set; }

        public DateTime SaleDate { get; set; } = DateTime.Now;

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(200)]
        public string? PaymentReference { get; set; }

        public DateTime? PaymentDate { get; set; }

        [ForeignKey("MedicationRequest")]
        public int? MedicationRequestID { get; set; } // Link to medication request if sale came from request

        // Navigation Properties
        public virtual Patient? Patient { get; set; }
        public virtual User SoldByUser { get; set; } = null!;
        public virtual MedicationRequest? MedicationRequest { get; set; }
        public virtual ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
    }
}