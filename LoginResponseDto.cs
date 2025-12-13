namespace PharmaCareSystem.Api.DTOs.Auth
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int UserID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int? PatientID { get; set; }
        public string? ProfileImageUrl { get; set; }
    }
}