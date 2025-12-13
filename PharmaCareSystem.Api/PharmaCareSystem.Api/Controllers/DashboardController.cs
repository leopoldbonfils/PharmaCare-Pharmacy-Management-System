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
    public class DashboardController : ControllerBase
    {
        private readonly PharmaCareDbContext _context;

        public DashboardController(PharmaCareDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var stats = new DashboardStatsDto();

            if (userRole == "Patient")
            {
                // Patient-specific stats
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                if (patient != null)
                {
                    stats.TotalPrescriptions = await _context.Prescriptions
                        .CountAsync(p => p.PatientID == patient.PatientID);
                    
                    stats.ActivePrescriptions = await _context.Prescriptions
                        .CountAsync(p => p.PatientID == patient.PatientID && 
                                        (p.Status == "Pending" || p.Status == "Approved"));
                }
            }
            else
            {
                // Admin/Pharmacist stats
                stats.TotalPatients = await _context.Patients.CountAsync(p => p.IsActive);
                stats.TotalMedicines = await _context.Medicines.CountAsync(m => m.IsActive);
                stats.TotalPrescriptions = await _context.Prescriptions.CountAsync();
                stats.TotalSales = await _context.Sales.SumAsync(s => s.TotalAmount);
                
                // Today's sales
                var today = DateTime.Today;
                stats.TodaySales = await _context.Sales
                    .Where(s => s.SaleDate.Date == today)
                    .SumAsync(s => s.TotalAmount);
            }

            return Ok(ApiResponse<DashboardStatsDto>.SuccessResponse("Dashboard stats retrieved", stats));
        }
    }

    public class DashboardStatsDto
    {
        public int TotalPatients { get; set; }
        public int TotalMedicines { get; set; }
        public int TotalPrescriptions { get; set; }
        public int ActivePrescriptions { get; set; }
        public decimal TotalSales { get; set; }
        public decimal TodaySales { get; set; }
    }
}

