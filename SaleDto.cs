namespace PharmaCareSystem.Api.DTOs.Sales
{
    public class SaleDto
    {
        public int SaleID { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int? PatientID { get; set; }
        public string? PatientName { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public int SoldBy { get; set; }
        public string SoldByName { get; set; } = string.Empty;
        public DateTime SaleDate { get; set; }
        public string? Notes { get; set; }
        public List<SaleItemDto> Items { get; set; } = new();
    }

    public class SaleItemDto
    {
        public int SaleItemID { get; set; }
        public int MedicineID { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string GenericName { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}