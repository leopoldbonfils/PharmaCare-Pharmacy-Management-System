using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Auth
{
    public class RegisterPatientDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        public DateTime? DateOfBirth { get; set; }

        public string? Gender { get; set; }

        [Required]
        [RegularExpression(@"^07[0-9]{8}$")]
        public string PhoneNumber { get; set; } = string.Empty;

        public string? Address { get; set; }

        public string? District { get; set; }

        public string? Sector { get; set; }

        public string? EmergencyContact { get; set; }

        public string? EmergencyContactName { get; set; }

        public string? MedicalHistory { get; set; }
        public string? Allergies { get; set; }
        public string? BloodType { get; set; }
    }
}
