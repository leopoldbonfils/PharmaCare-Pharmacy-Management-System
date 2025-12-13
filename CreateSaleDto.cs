using System.ComponentModel.DataAnnotations;

namespace PharmaCareSystem.Api.DTOs.Sales
{
    public class CreateSaleDto
    {
        public int? PatientID { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;

        public string? Notes { get; set; }

        [Required]
        public List<CreateSaleItemDto> Items { get; set; } = new();
    }

    public class CreateSaleItemDto
    {
        [Required]
        public int MedicineID { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }
}