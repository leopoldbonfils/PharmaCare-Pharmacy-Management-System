using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Prescriptions
{
    public class CreatePrescriptionDto
    {
        [Required]
        public int PatientID { get; set; }

        [Required]
        public string DoctorName { get; set; } = string.Empty;

        [Required]
        public string DoctorContact { get; set; } = string.Empty;

        public string? HospitalName { get; set; }

        [Required]
        public string Diagnosis { get; set; } = string.Empty;

        public string? Instructions { get; set; }

        public string? PrescriptionImageUrl { get; set; }

        [Required]
        public List<CreatePrescriptionItemDto> Items { get; set; } = new();
    }

    public class CreatePrescriptionItemDto
    {
        [Required]
        public int MedicineID { get; set; }

        [Required]
        public string Dosage { get; set; } = string.Empty;

        [Required]
        public string Frequency { get; set; } = string.Empty;

        [Required]
        public string Duration { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        public string? Instructions { get; set; }
    }
}
