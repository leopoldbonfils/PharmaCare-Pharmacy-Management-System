using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class PrescriptionItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PrescriptionItemID { get; set; }

        [Required]
        [ForeignKey("Prescription")]
        public int PrescriptionID { get; set; }

        [Required]
        [ForeignKey("Medicine")]
        public int MedicineID { get; set; }

        [Required]
        [StringLength(50)]
        public string Dosage { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Frequency { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Duration { get; set; } = string.Empty;

        [Required]
        public int Quantity { get; set; }

        [StringLength(500)]
        public string? Instructions { get; set; }

        // Navigation Properties
        public virtual Prescription Prescription { get; set; } = null!;
        public virtual Medicine Medicine { get; set; } = null!;
    }
}