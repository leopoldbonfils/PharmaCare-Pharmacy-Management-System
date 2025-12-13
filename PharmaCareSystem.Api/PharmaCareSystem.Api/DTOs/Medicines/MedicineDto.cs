namespace PharmaCareSystem.Api.DTOs.Medicines
{
    public class MedicineDto
    {
        public int MedicineID { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string GenericName { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public int DaysUntilExpiry => (ExpiryDate.Date - DateTime.Now.Date).Days;
        public int StockQuantity { get; set; }
        public int ReorderLevel { get; set; }
        public bool IsLowStock => StockQuantity <= ReorderLevel;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
