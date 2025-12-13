using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Auth
{
    public class RegisterPharmacistDto
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

        [Required]
        [RegularExpression(@"^07[0-9]{8}$")]
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
