namespace PharmaCareSystem.Api.DTOs.Prescriptions
{
    public class PrescriptionAlertDto
    {
        public string Type { get; set; } = string.Empty; // Duplicate, Antibiotic, ActivePrescriptions
        public string Severity { get; set; } = string.Empty; // Warning, Error, Info
        public string Message { get; set; } = string.Empty;
        public int? PrescriptionId { get; set; }
        public string? MedicineName { get; set; }
    }
}

