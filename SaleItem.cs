using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaCareSystem.Api.Models
{
    public class SaleItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SaleItemID { get; set; }

        [Required]
        [ForeignKey("Sale")]
        public int SaleID { get; set; }

        [Required]
        [ForeignKey("Medicine")]
        public int MedicineID { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalPrice { get; set; }

        // Navigation Properties
        public virtual Sale Sale { get; set; } = null!;
        public virtual Medicine Medicine { get; set; } = null!;
    }
}