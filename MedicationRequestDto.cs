namespace PharmaCareSystem.Api.DTOs.MedicationRequests
{
    public class MedicationRequestDto
    {
        public int MedicationRequestID { get; set; }
        public int PatientID { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int PharmacistID { get; set; }
        public string PharmacistName { get; set; } = string.Empty;
        public string PharmacyName { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Notes { get; set; }
        public string? PharmacistNotes { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? PrescriptionID { get; set; }
        public DateTime RequestDate { get; set; }
        public DateTime? ReviewedDate { get; set; }
        public int? ReviewedBy { get; set; }
        public string? ReviewedByName { get; set; }
        public decimal TotalAmount { get; set; } // Calculated total from request items
        public List<MedicationRequestItemDto> RequestItems { get; set; } = new();
    }

    public class MedicationRequestItemDto
    {
        public int RequestItemID { get; set; }
        public int MedicineID { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string GenericName { get; set; } = string.Empty;
        public int RequestedQuantity { get; set; }
        public int AvailableStock { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateMedicationRequestDto
    {
        public int PatientID { get; set; }
        public int PharmacistID { get; set; }
        public string Symptoms { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Notes { get; set; }
        public List<CreateMedicationRequestItemDto> RequestItems { get; set; } = new();
    }

    public class CreateMedicationRequestItemDto
    {
        public int MedicineID { get; set; }
        public int RequestedQuantity { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateMedicationRequestStatusDto
    {
        public string Status { get; set; } = string.Empty; // Reviewed, Approved, Rejected
        public string? PharmacistNotes { get; set; }
        public int? PrescriptionID { get; set; } // If converting to prescription
        public List<UpdateMedicationRequestItemDto>? ModifiedItems { get; set; } // For quantity modifications
    }

    public class UpdateMedicationRequestItemDto
    {
        public int RequestItemID { get; set; }
        public int ApprovedQuantity { get; set; }
    }
}

