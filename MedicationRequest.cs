using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class MedicationRequest
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MedicationRequestID { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public int PatientID { get; set; }

        [Required]
        [ForeignKey("Pharmacist")]
        public int PharmacistID { get; set; }

        [Required]
        [StringLength(1000)]
        public string Symptoms { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        [StringLength(1000)]
        public string? PharmacistNotes { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Reviewed, Approved, Rejected, Cancelled

        [ForeignKey("Prescription")]
        public int? PrescriptionID { get; set; } // If converted to prescription

        public DateTime RequestDate { get; set; } = DateTime.Now;

        public DateTime? ReviewedDate { get; set; }

        [ForeignKey("ReviewedByUser")]
        public int? ReviewedBy { get; set; }

        // Navigation Properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual User Pharmacist { get; set; } = null!;
        public virtual User? ReviewedByUser { get; set; }
        public virtual Prescription? Prescription { get; set; }
        public virtual ICollection<MedicationRequestItem> RequestItems { get; set; } = new List<MedicationRequestItem>();
    }

    public class MedicationRequestItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RequestItemID { get; set; }

        [Required]
        [ForeignKey("MedicationRequest")]
        public int MedicationRequestID { get; set; }

        [Required]
        [ForeignKey("Medicine")]
        public int MedicineID { get; set; }

        [Required]
        public int RequestedQuantity { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        // Navigation Properties
        public virtual MedicationRequest MedicationRequest { get; set; } = null!;
        public virtual Medicine Medicine { get; set; } = null!;
    }
}
