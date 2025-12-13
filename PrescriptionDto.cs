namespace PharmaCareSystem.Api.DTOs.Prescriptions
{
    public class PrescriptionDto
    {
        public int PrescriptionID { get; set; }
        public int PatientID { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string DoctorContact { get; set; } = string.Empty;
        public string? HospitalName { get; set; }
        public DateTime PrescriptionDate { get; set; }
        public string Diagnosis { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Instructions { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime? DispensedDate { get; set; }
        public int? DispensedBy { get; set; }
        public string? DispensedByName { get; set; }
        public string? PrescriptionImageUrl { get; set; }
        public List<PrescriptionItemDto> Items { get; set; } = new();
    }

    public class PrescriptionItemDto
    {
        public int PrescriptionItemID { get; set; }
        public int MedicineID { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string GenericName { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice => Quantity * UnitPrice;
        public string? Instructions { get; set; }
    }
}