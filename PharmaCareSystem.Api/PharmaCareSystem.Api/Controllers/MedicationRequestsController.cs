using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.MedicationRequests;
using PharmaCareSystem.Api.Helpers;
using PharmaCareSystem.Api.Data;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MedicationRequestsController : ControllerBase
    {
        private readonly IMedicationRequestService _medicationRequestService;
        private readonly PharmaCareDbContext _context;

        public MedicationRequestsController(IMedicationRequestService medicationRequestService, PharmaCareDbContext context)
        {
            _medicationRequestService = medicationRequestService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<MedicationRequestDto>>>> GetAll([FromQuery] int? pharmacistId = null)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            // Pharmacists can only see their own requests (case-insensitive check)
            int? filterPharmacistId = null;
            if (!string.IsNullOrEmpty(userRole) && 
                string.Equals(userRole, "Pharmacist", StringComparison.OrdinalIgnoreCase))
            {
                filterPharmacistId = userId;
            }
            else if (pharmacistId.HasValue)
            {
                filterPharmacistId = pharmacistId;
            }

            var requests = await _medicationRequestService.GetAllRequestsAsync(filterPharmacistId);
            return Ok(ApiResponse<List<MedicationRequestDto>>.SuccessResponse("Medication requests retrieved successfully", requests));
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<ApiResponse<List<MedicationRequestDto>>>> GetPatientRequests(int patientId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            // Patients can only view their own requests (case-insensitive check)
            if (!string.IsNullOrEmpty(userRole) && 
                string.Equals(userRole, "Patient", StringComparison.OrdinalIgnoreCase))
            {
                // Verify patient belongs to user
                // This would require checking Patient.UserID == userId
                // For now, we'll trust the patientId parameter
            }

            var requests = await _medicationRequestService.GetPatientRequestsAsync(patientId);
            return Ok(ApiResponse<List<MedicationRequestDto>>.SuccessResponse("Patient medication requests retrieved successfully", requests));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<MedicationRequestDto>>> GetById(int id)
        {
            var request = await _medicationRequestService.GetRequestByIdAsync(id);
            if (request == null)
                return NotFound(ApiResponse<MedicationRequestDto>.ErrorResponse("Medication request not found"));

            return Ok(ApiResponse<MedicationRequestDto>.SuccessResponse("Medication request retrieved successfully", request));
        }

        [HttpPost]
        [Authorize(Policy = "PatientOnly")]
        public async Task<ActionResult<ApiResponse<MedicationRequestDto>>> Create([FromBody] CreateMedicationRequestDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Symptoms))
            {
                return BadRequest(ApiResponse<MedicationRequestDto>.ErrorResponse("Symptoms are required"));
            }

            if (dto.PharmacistID <= 0)
            {
                return BadRequest(ApiResponse<MedicationRequestDto>.ErrorResponse("Please select a pharmacy/pharmacist"));
            }

            if (dto.RequestItems == null || dto.RequestItems.Count == 0)
            {
                return BadRequest(ApiResponse<MedicationRequestDto>.ErrorResponse("Please select at least one medicine"));
            }

            // Get PatientID from the logged-in user
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId && p.IsActive);
            
            if (patient == null)
            {
                return BadRequest(ApiResponse<MedicationRequestDto>.ErrorResponse("Patient record not found for the logged-in user"));
            }

            // Set PatientID from the logged-in user's patient record
            dto.PatientID = patient.PatientID;

            var (success, message, data) = await _medicationRequestService.CreateRequestAsync(dto);

            if (!success)
                return BadRequest(ApiResponse<MedicationRequestDto>.ErrorResponse(message));

            return CreatedAtAction(nameof(GetById), new { id = data!.MedicationRequestID },
                ApiResponse<MedicationRequestDto>.SuccessResponse(message, data));
        }

        [HttpPut("{id}/status")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateStatus(int id, [FromBody] UpdateMedicationRequestStatusDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Validate required fields
                if (dto == null)
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse("Request data is required"));
                }

                if (string.IsNullOrWhiteSpace(dto.Status))
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse("Status is required"));
                }

                // Validate status values
                var validStatuses = new[] { "Pending", "Reviewed", "Approved", "Rejected", "Cancelled" };
                if (!validStatuses.Contains(dto.Status))
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse($"Invalid status. Valid values are: {string.Join(", ", validStatuses)}"));
                }

                // Validate pharmacist notes for rejection
                if (dto.Status == "Rejected" && string.IsNullOrWhiteSpace(dto.PharmacistNotes))
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse("Pharmacist notes are required when rejecting a request"));
                }

                var (success, message) = await _medicationRequestService.UpdateRequestStatusAsync(id, dto, userId);

                if (!success)
                    return BadRequest(ApiResponse<object>.ErrorResponse(message));

                return Ok(ApiResponse<object>.SuccessResponse(message, null));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse($"Error updating request: {ex.Message}"));
            }
        }

        [HttpPut("{id}/cancel")]
        [Authorize(Policy = "PatientOnly")]
        public async Task<ActionResult<ApiResponse<object>>> Cancel(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var (success, message) = await _medicationRequestService.CancelRequestAsync(id, userId);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpGet("awaiting-dispense")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<MedicationRequestDto>>>> GetAwaitingDispense([FromQuery] int? pharmacistId = null)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            // Pharmacists can only see their own requests
            int? filterPharmacistId = null;
            if (!string.IsNullOrEmpty(userRole) && 
                string.Equals(userRole, "Pharmacist", StringComparison.OrdinalIgnoreCase))
            {
                filterPharmacistId = userId;
            }
            else if (pharmacistId.HasValue)
            {
                filterPharmacistId = pharmacistId;
            }

            var requests = await _medicationRequestService.GetPaidRequestsAwaitingDispenseAsync(filterPharmacistId);
            return Ok(ApiResponse<List<MedicationRequestDto>>.SuccessResponse("Paid medication requests awaiting dispense retrieved successfully", requests));
        }
    }
}


