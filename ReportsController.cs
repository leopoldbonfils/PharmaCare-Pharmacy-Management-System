using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Helpers;
using System.Security.Claims;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly PharmaCareDbContext _context;

        public ReportsController(PharmaCareDbContext context)
        {
            _context = context;
        }

        [HttpGet("best-selling-medicines")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<BestSellingMedicineDto>>>> GetBestSellingMedicines()
        {
            var medicines = await _context.SaleItems
                .Include(si => si.Medicine)
                .GroupBy(si => new { si.MedicineID, si.Medicine.MedicineName, si.Medicine.GenericName })
                .Select(g => new BestSellingMedicineDto
                {
                    MedicineID = g.Key.MedicineID,
                    MedicineName = g.Key.MedicineName,
                    GenericName = g.Key.GenericName,
                    TotalQuantitySold = g.Sum(si => si.Quantity),
                    TotalRevenue = g.Sum(si => si.Quantity * si.UnitPrice)
                })
                .OrderByDescending(m => m.TotalQuantitySold)
                .Take(10)
                .ToListAsync();

            return Ok(ApiResponse<List<BestSellingMedicineDto>>.SuccessResponse("Best selling medicines retrieved", medicines));
        }

        [HttpGet("monthly-revenue")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<MonthlyRevenueDto>>>> GetMonthlyRevenue()
        {
            var startDate = DateTime.Now.AddMonths(-12);
            var revenues = await _context.Sales
                .Where(s => s.SaleDate >= startDate)
                .GroupBy(s => new { Year = s.SaleDate.Year, Month = s.SaleDate.Month })
                .Select(g => new MonthlyRevenueDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(s => s.TotalAmount),
                    SalesCount = g.Count()
                })
                .OrderBy(r => r.Year)
                .ThenBy(r => r.Month)
                .ToListAsync();

            return Ok(ApiResponse<List<MonthlyRevenueDto>>.SuccessResponse("Monthly revenue retrieved", revenues));
        }

        [HttpGet("monthly-patients")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<MonthlyPatientsDto>>>> GetMonthlyPatients()
        {
            var startDate = DateTime.Now.AddMonths(-12);
            var patients = await _context.Sales
                .Where(s => s.SaleDate >= startDate && s.PatientID != null)
                .GroupBy(s => new { Year = s.SaleDate.Year, Month = s.SaleDate.Month })
                .Select(g => new MonthlyPatientsDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    PatientCount = g.Select(s => s.PatientID).Distinct().Count()
                })
                .OrderBy(p => p.Year)
                .ThenBy(p => p.Month)
                .ToListAsync();

            return Ok(ApiResponse<List<MonthlyPatientsDto>>.SuccessResponse("Monthly patients retrieved", patients));
        }

        [HttpGet("stock-value")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<StockValueDto>>> GetStockValue()
        {
            var stockValue = await _context.Medicines
                .Where(m => m.IsActive)
                .SumAsync(m => m.StockQuantity * m.Price);

            var totalMedicines = await _context.Medicines.CountAsync(m => m.IsActive);
            var lowStockMedicines = await _context.Medicines
                .CountAsync(m => m.IsActive && m.StockQuantity <= m.ReorderLevel);

            var result = new StockValueDto
            {
                TotalStockValue = stockValue,
                TotalMedicines = totalMedicines,
                LowStockCount = lowStockMedicines
            };

            return Ok(ApiResponse<StockValueDto>.SuccessResponse("Stock value retrieved", result));
        }

        [HttpGet("top-prescribed-medicines")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<TopPrescribedMedicineDto>>>> GetTopPrescribedMedicines()
        {
            var medicines = await _context.PrescriptionItems
                .Include(pi => pi.Medicine)
                .GroupBy(pi => new { pi.MedicineID, pi.Medicine.MedicineName, pi.Medicine.GenericName })
                .Select(g => new TopPrescribedMedicineDto
                {
                    MedicineID = g.Key.MedicineID,
                    MedicineName = g.Key.MedicineName,
                    GenericName = g.Key.GenericName,
                    PrescriptionCount = g.Count(),
                    TotalQuantity = g.Sum(pi => pi.Quantity)
                })
                .OrderByDescending(m => m.PrescriptionCount)
                .Take(5)
                .ToListAsync();

            return Ok(ApiResponse<List<TopPrescribedMedicineDto>>.SuccessResponse("Top prescribed medicines retrieved", medicines));
        }

        [HttpGet("total-users")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ApiResponse<TotalUsersDto>>> GetTotalUsers()
        {
            var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
            var administrators = await _context.Users.CountAsync(u => u.IsActive && u.Role == "Administrator");
            var pharmacists = await _context.Users.CountAsync(u => u.IsActive && u.Role == "Pharmacist");
            var patients = await _context.Users.CountAsync(u => u.IsActive && u.Role == "Patient");

            var result = new TotalUsersDto
            {
                TotalUsers = totalUsers,
                Administrators = administrators,
                Pharmacists = pharmacists,
                Patients = patients
            };

            return Ok(ApiResponse<TotalUsersDto>.SuccessResponse("Total users retrieved", result));
        }
    }

    public class BestSellingMedicineDto
    {
        public int MedicineID { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string GenericName { get; set; } = string.Empty;
        public int TotalQuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class MonthlyRevenueDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal Revenue { get; set; }
        public int SalesCount { get; set; }
    }

    public class MonthlyPatientsDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int PatientCount { get; set; }
    }

    public class StockValueDto
    {
        public decimal TotalStockValue { get; set; }
        public int TotalMedicines { get; set; }
        public int LowStockCount { get; set; }
    }

    public class TopPrescribedMedicineDto
    {
        public int MedicineID { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string GenericName { get; set; } = string.Empty;
        public int PrescriptionCount { get; set; }
        public int TotalQuantity { get; set; }
    }

    public class TotalUsersDto
    {
        public int TotalUsers { get; set; }
        public int Administrators { get; set; }
        public int Pharmacists { get; set; }
        public int Patients { get; set; }
    }
}

