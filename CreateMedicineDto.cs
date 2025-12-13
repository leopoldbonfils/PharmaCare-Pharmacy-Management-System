using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Medicines
{
    public class CreateMedicineDto
    {
        [Required]
        public string MedicineName { get; set; } = string.Empty;

        [Required]
        public string GenericName { get; set; } = string.Empty;

        [Required]
        public string Manufacturer { get; set; } = string.Empty;

        [Required]
        public string BatchNumber { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiryDate { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int ReorderLevel { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Dosage { get; set; } = string.Empty;

        public string? Description { get; set; }
    }
}
