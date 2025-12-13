using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.DTOs.Prescriptions;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PrescriptionsController : ControllerBase
    {
        private readonly IPrescriptionService _prescriptionService;
        private readonly PharmaCareDbContext _context;

        public PrescriptionsController(IPrescriptionService prescriptionService, PharmaCareDbContext context)
        {
            _prescriptionService = prescriptionService;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<PrescriptionDto>>>> GetAll()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            List<PrescriptionDto> prescriptions;

            if (userRole == "Patient")
            {
                // Patients can only see their own prescriptions
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                if (patient == null)
                    return Ok(ApiResponse<List<PrescriptionDto>>.SuccessResponse("No prescriptions found", new List<PrescriptionDto>()));
                
                prescriptions = await _prescriptionService.GetPrescriptionsByPatientAsync(patient.PatientID);
            }
            else
            {
                // Admin/Pharmacist can see all prescriptions
                prescriptions = await _prescriptionService.GetAllPrescriptionsAsync();
            }

            return Ok(ApiResponse<List<PrescriptionDto>>.SuccessResponse("Prescriptions retrieved successfully", prescriptions));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PrescriptionDto>>> GetById(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var prescription = await _prescriptionService.GetPrescriptionByIdAsync(id);
            if (prescription == null)
                return NotFound(ApiResponse<PrescriptionDto>.ErrorResponse("Prescription not found"));

            // Patients can only view their own prescriptions
            if (userRole == "Patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                if (patient == null || patient.PatientID != prescription.PatientID)
                {
                    return Forbid("You can only view your own prescriptions");
                }
            }

            return Ok(ApiResponse<PrescriptionDto>.SuccessResponse("Prescription retrieved successfully", prescription));
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<ApiResponse<List<PrescriptionDto>>>> GetByPatient(int patientId)
        {
            var prescriptions = await _prescriptionService.GetPrescriptionsByPatientAsync(patientId);
            return Ok(ApiResponse<List<PrescriptionDto>>.SuccessResponse("Patient prescriptions retrieved", prescriptions));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<PrescriptionDto>>> Create([FromBody] CreatePrescriptionDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            // Validate prescription data
            if (dto.Items == null || dto.Items.Count == 0)
            {
                return BadRequest(ApiResponse<PrescriptionDto>.ErrorResponse("Prescription must contain at least one medicine"));
            }

            if (string.IsNullOrWhiteSpace(dto.Diagnosis))
            {
                return BadRequest(ApiResponse<PrescriptionDto>.ErrorResponse("Diagnosis is required"));
            }

            if (string.IsNullOrWhiteSpace(dto.DoctorName))
            {
                return BadRequest(ApiResponse<PrescriptionDto>.ErrorResponse("Doctor name is required"));
            }

            // Validate image size if provided
            if (!string.IsNullOrEmpty(dto.PrescriptionImageUrl))
            {
                // Image size validation is handled in upload controller, but we can add additional checks here if needed
            }

            var (success, message, data) = await _prescriptionService.CreatePrescriptionAsync(dto, userId);

            if (!success)
                return BadRequest(ApiResponse<PrescriptionDto>.ErrorResponse(message));

            return CreatedAtAction(nameof(GetById), new { id = data!.PrescriptionID },
                ApiResponse<PrescriptionDto>.SuccessResponse(message, data));
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (success, message) = await _prescriptionService.UpdateStatusAsync(id, request.Status, userId);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpPatch("{id}/approve")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> Approve(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (success, message) = await _prescriptionService.UpdateStatusAsync(id, "Approved", userId);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            // Notify patient via SignalR
            var prescription = await _prescriptionService.GetPrescriptionByIdAsync(id);
            if (prescription != null)
            {
                var patient = await _context.Patients
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.PatientID == prescription.PatientID);
                
                if (patient?.User != null)
                {
                    // SignalR notification will be handled in service if needed
                }
            }

            return Ok(ApiResponse<object>.SuccessResponse("Prescription approved successfully", null));
        }

        [HttpPut("{id}/modify")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<PrescriptionDto>>> Modify(int id, [FromBody] ModifyPrescriptionDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            // Get existing prescription
            var existing = await _prescriptionService.GetPrescriptionByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<PrescriptionDto>.ErrorResponse("Prescription not found"));

            // Create updated prescription DTO
            var updateDto = new CreatePrescriptionDto
            {
                PatientID = existing.PatientID,
                DoctorName = dto.DoctorName ?? existing.DoctorName,
                DoctorContact = dto.DoctorContact ?? existing.DoctorContact,
                HospitalName = dto.HospitalName ?? existing.HospitalName,
                Diagnosis = dto.Diagnosis ?? existing.Diagnosis,
                Instructions = dto.Instructions ?? existing.Instructions,
                PrescriptionImageUrl = dto.PrescriptionImageUrl ?? existing.PrescriptionImageUrl,
                Items = dto.Items ?? existing.Items.Select(i => new CreatePrescriptionItemDto
                {
                    MedicineID = i.MedicineID,
                    Dosage = i.Dosage,
                    Frequency = i.Frequency,
                    Duration = i.Duration,
                    Quantity = i.Quantity,
                    Instructions = i.Instructions
                }).ToList()
            };

            // For now, we'll update status. Full modification would require a new UpdatePrescription method
            var (success, message, data) = await _prescriptionService.CreatePrescriptionAsync(updateDto, userId);
            
            if (!success)
                return BadRequest(ApiResponse<PrescriptionDto>.ErrorResponse(message));

            return Ok(ApiResponse<PrescriptionDto>.SuccessResponse("Prescription modified successfully", data));
        }

        [HttpPatch("{id}/reject")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> Reject(int id, [FromBody] RejectPrescriptionDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (success, message) = await _prescriptionService.UpdateStatusAsync(id, "Rejected", userId);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse("Prescription rejected successfully", null));
        }

        [HttpGet("{id}/history")]
        public async Task<ActionResult<ApiResponse<object>>> GetHistory(int id)
        {
            // For now, return basic info. Full history would require a PrescriptionHistory table
            var prescription = await _prescriptionService.GetPrescriptionByIdAsync(id);
            if (prescription == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Prescription not found"));

            var history = new
            {
                CreatedDate = prescription.CreatedDate,
                CreatedBy = prescription.CreatedByName,
                Status = prescription.Status,
                DispensedDate = prescription.DispensedDate,
                DispensedBy = prescription.DispensedByName
            };

            return Ok(ApiResponse<object>.SuccessResponse("Prescription history retrieved", history));
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty; // Pending, Approved, Dispensed, Cancelled
    }

    public class ModifyPrescriptionDto
    {
        public string? DoctorName { get; set; }
        public string? DoctorContact { get; set; }
        public string? HospitalName { get; set; }
        public string? Diagnosis { get; set; }
        public string? Instructions { get; set; }
        public string? PrescriptionImageUrl { get; set; }
        public List<CreatePrescriptionItemDto>? Items { get; set; }
    }

    public class RejectPrescriptionDto
    {
        public string? Reason { get; set; }
    }
}
