using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class Prescription
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PrescriptionID { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public int PatientID { get; set; }

        [Required]
        [StringLength(100)]
        public string DoctorName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string DoctorContact { get; set; } = string.Empty;

        [StringLength(100)]
        public string? HospitalName { get; set; }

        [Required]
        public DateTime PrescriptionDate { get; set; } = DateTime.Now.Date;

        [Required]
        [StringLength(500)]
        public string Diagnosis { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        public string? Instructions { get; set; }

        [Required]
        [ForeignKey("CreatedByUser")]
        public int CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? DispensedDate { get; set; }

        [ForeignKey("DispensedByUser")]
        public int? DispensedBy { get; set; }

        [StringLength(500)]
        public string? PrescriptionImageUrl { get; set; }

        // Navigation Properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual User CreatedByUser { get; set; } = null!;
        public virtual User? DispensedByUser { get; set; }
        public virtual ICollection<PrescriptionItem> PrescriptionItems { get; set; } = new List<PrescriptionItem>();
    }
}