using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Patients
{
    public class CreatePatientDto
    {
        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^07[0-9]{8}$")]
        public string PhoneNumber { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public string District { get; set; } = string.Empty;

        [Required]
        public string Sector { get; set; } = string.Empty;

        [Required]
        public string EmergencyContact { get; set; } = string.Empty;

        [Required]
        public string EmergencyContactName { get; set; } = string.Empty;

        public string? MedicalHistory { get; set; }
        public string? Allergies { get; set; }
        public string? BloodType { get; set; }
    }
}