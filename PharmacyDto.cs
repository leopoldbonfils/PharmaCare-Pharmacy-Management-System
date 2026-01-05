namespace PharmaCareSystem.Api.DTOs.Pharmacies
{
    public class PharmacyDto
    {
        public int PharmacistID { get; set; }
        public string PharmacistName { get; set; } = string.Empty;
        public string PharmacyName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? Address { get; set; }
        public string? OpenHours { get; set; }
        public bool IsActive { get; set; }
        public string? ImageUrl { get; set; }
    }
}

