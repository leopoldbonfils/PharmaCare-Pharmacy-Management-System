using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Patients;
using PharmaCareSystem.Api.DTOs.Prescriptions;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PatientsController : ControllerBase
    {
        private readonly IPatientService _patientService;
        private readonly IPrescriptionService _prescriptionService;
        private readonly IDuplicateMedicineCheckerService _alertService;
        private readonly PharmaCareDbContext _context;

        public PatientsController(
            IPatientService patientService,
            IPrescriptionService prescriptionService,
            IDuplicateMedicineCheckerService alertService,
            PharmaCareDbContext context)
        {
            _patientService = patientService;
            _prescriptionService = prescriptionService;
            _alertService = alertService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<PatientDto>>>> GetAll()
        {
            var patients = await _patientService.GetAllPatientsAsync();
            return Ok(ApiResponse<List<PatientDto>>.SuccessResponse("Patients retrieved successfully", patients));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PatientDto>>> GetById(int id)
        {
            var patient = await _patientService.GetPatientByIdAsync(id);
            if (patient == null)
                return NotFound(ApiResponse<PatientDto>.ErrorResponse("Patient not found"));

            return Ok(ApiResponse<PatientDto>.SuccessResponse("Patient retrieved successfully", patient));
        }

        [HttpGet("search/{searchTerm}")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<PatientDto>>>> Search(string searchTerm)
        {
            var patients = await _patientService.SearchPatientsAsync(searchTerm);
            return Ok(ApiResponse<List<PatientDto>>.SuccessResponse("Search completed", patients));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<PatientDto>>> Create([FromBody] CreatePatientDto dto)
        {
            var (success, message, data) = await _patientService.CreatePatientAsync(dto);

            if (!success)
                return BadRequest(ApiResponse<PatientDto>.ErrorResponse(message));

            return CreatedAtAction(nameof(GetById), new { id = data!.PatientID },
                ApiResponse<PatientDto>.SuccessResponse(message, data));
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] CreatePatientDto dto)
        {
            var (success, message) = await _patientService.UpdatePatientAsync(id, dto);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        {
            var (success, message) = await _patientService.DeletePatientAsync(id);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpGet("{id}/prescriptions")]
        public async Task<ActionResult<ApiResponse<List<PrescriptionDto>>>> GetPatientPrescriptions(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            // Patients can only view their own prescriptions
            if (userRole == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                if (patient == null || patient.PatientID != id)
                {
                    return Forbid("You can only view your own prescriptions");
                }
            }
            // Admin/Pharmacist can view any patient's prescriptions

            var prescriptions = await _prescriptionService.GetPrescriptionsByPatientAsync(id);
            return Ok(ApiResponse<List<PrescriptionDto>>.SuccessResponse("Patient prescriptions retrieved successfully", prescriptions));
        }

        [HttpPost("{id}/alerts")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<PrescriptionAlertDto>>>> GetPatientAlerts(int id, [FromBody] CreatePrescriptionDto prescription)
        {
            if (prescription == null || prescription.Items == null || prescription.Items.Count == 0)
            {
                return Ok(ApiResponse<List<PrescriptionAlertDto>>.SuccessResponse("No prescription data provided for alert checking", new List<PrescriptionAlertDto>()));
            }

            var alerts = await _alertService.CheckForAlertsAsync(id, prescription);
            return Ok(ApiResponse<List<PrescriptionAlertDto>>.SuccessResponse("Alerts retrieved successfully", alerts));
        }
    }
}
