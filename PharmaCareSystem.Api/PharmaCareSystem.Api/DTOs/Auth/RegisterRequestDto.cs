using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Auth
{
    public class RegisterRequestDto : RegisterPatientDto
    {
        [Required]
        public string Role { get; set; } = "Patient";
    }
}
