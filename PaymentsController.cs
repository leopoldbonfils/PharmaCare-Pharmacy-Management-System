using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Payments;
using PharmaCareSystem.Api.Helpers;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly PharmaCareDbContext _context;

        public PaymentsController(IPaymentService paymentService, PharmaCareDbContext context)
        {
            _paymentService = paymentService;
            _context = context;
        }

        [HttpGet("my-payments")]
        public async Task<ActionResult<ApiResponse<List<PaymentDto>>>> GetMyPayments()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                
                if (patient == null)
                {
                    return BadRequest(ApiResponse<List<PaymentDto>>.ErrorResponse("Patient profile not found"));
                }

                var payments = await _paymentService.GetPatientPaymentsAsync(patient.PatientID);
                return Ok(ApiResponse<List<PaymentDto>>.SuccessResponse("Payments retrieved successfully", payments));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMyPayments: {ex.Message}");
                return StatusCode(500, ApiResponse<List<PaymentDto>>.ErrorResponse("Failed to retrieve payments"));
            }
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<ApiResponse<List<PaymentDto>>>> GetPatientPayments(int patientId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

                // Patients can only view their own payments
                if (userRole == "Patient")
                {
                    var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                    if (patient == null || patient.PatientID != patientId)
                    {
                        return Forbid();
                    }
                }

                var payments = await _paymentService.GetPatientPaymentsAsync(patientId);
                return Ok(ApiResponse<List<PaymentDto>>.SuccessResponse("Patient payments retrieved successfully", payments));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPatientPayments: {ex.Message}");
                return StatusCode(500, ApiResponse<List<PaymentDto>>.ErrorResponse("Failed to retrieve payments"));
            }
        }

        [HttpGet("prescription/{prescriptionId}")]
        public async Task<ActionResult<ApiResponse<List<PaymentDto>>>> GetPrescriptionPayments(int prescriptionId)
        {
            try
            {
                var payments = await _paymentService.GetPrescriptionPaymentsAsync(prescriptionId);
                return Ok(ApiResponse<List<PaymentDto>>.SuccessResponse("Prescription payments retrieved successfully", payments));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPrescriptionPayments: {ex.Message}");
                return StatusCode(500, ApiResponse<List<PaymentDto>>.ErrorResponse("Failed to retrieve payments"));
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PaymentDto>>> GetById(int id)
        {
            try
            {
                var payment = await _paymentService.GetPaymentByIdAsync(id);
                if (payment == null)
                    return NotFound(ApiResponse<PaymentDto>.ErrorResponse("Payment not found"));

                // Patients can only view their own payments
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
                
                if (userRole == "Patient")
                {
                    var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                    if (patient == null || patient.PatientID != payment.PatientID)
                    {
                        return Forbid();
                    }
                }

                return Ok(ApiResponse<PaymentDto>.SuccessResponse("Payment retrieved successfully", payment));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetById: {ex.Message}");
                return StatusCode(500, ApiResponse<PaymentDto>.ErrorResponse("Failed to retrieve payment"));
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<PaymentDto>>> Create([FromBody] CreatePaymentDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (string.IsNullOrWhiteSpace(dto.Method))
                {
                    return BadRequest(ApiResponse<PaymentDto>.ErrorResponse("Payment method is required"));
                }

                var validMethods = new[] { "MTN_MoMo", "Airtel_Money", "Credit_Card", "Cash" };
                if (!validMethods.Contains(dto.Method))
                {
                    return BadRequest(ApiResponse<PaymentDto>.ErrorResponse("Invalid payment method. Use: MTN_MoMo, Airtel_Money, Credit_Card, or Cash"));
                }

                // Allow any transaction reference - user can enter any value
                // Transaction reference is optional for Cash payments

                // Get patient ID from authenticated user
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                if (patient == null)
                {
                    return BadRequest(ApiResponse<PaymentDto>.ErrorResponse("Patient profile not found"));
                }

                var (success, message, data) = await _paymentService.CreatePaymentAsync(dto, patient.PatientID);

                if (!success)
                {
                    // Provide more detailed error message
                    if (message.Contains("Database error") || message.Contains("PrescriptionID"))
                    {
                        return BadRequest(ApiResponse<PaymentDto>.ErrorResponse(
                            message + " Please contact administrator to run the database migration script: FixPaymentsTablePrescriptionID.sql"
                        ));
                    }
                    return BadRequest(ApiResponse<PaymentDto>.ErrorResponse(message));
                }

                // Payment is now auto-completed in CreatePaymentAsync if Cash or has transaction ref
                // No need for separate update call - it's already done

                return CreatedAtAction(nameof(GetById), new { id = data!.PaymentID },
                    ApiResponse<PaymentDto>.SuccessResponse(message, data));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Create: {ex.Message}");
                return StatusCode(500, ApiResponse<PaymentDto>.ErrorResponse("Failed to create payment"));
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Pharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateStatus(int id, [FromBody] PaymentStatusDto dto)
        {
            try
            {
                var (success, message) = await _paymentService.UpdatePaymentStatusAsync(id, dto);

                if (!success)
                    return BadRequest(ApiResponse<object>.ErrorResponse(message));

                return Ok(ApiResponse<object>.SuccessResponse(message, null));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateStatus: {ex.Message}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to update payment status"));
            }
        }

        // Utility endpoint to create payments for existing prescriptions
        [HttpPost("create-for-prescription/{prescriptionId}")]
        [Authorize(Roles = "Admin,Pharmacist")]
        public async Task<ActionResult<ApiResponse<PaymentDto>>> CreatePaymentForPrescription(int prescriptionId, [FromBody] CreatePaymentDto dto)
        {
            try
            {
                // Get prescription to find patient
                var prescription = await _context.Prescriptions
                    .Include(p => p.Patient)
                    .FirstOrDefaultAsync(p => p.PrescriptionID == prescriptionId);

                if (prescription == null)
                {
                    return NotFound(ApiResponse<PaymentDto>.ErrorResponse("Prescription not found"));
                }

                // Check if payment already exists
                var existingPayment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.PrescriptionID == prescriptionId && p.Status == "Completed");

                if (existingPayment != null)
                {
                    return BadRequest(ApiResponse<PaymentDto>.ErrorResponse("Payment already exists for this prescription"));
                }

                var (success, message, data) = await _paymentService.CreatePaymentAsync(dto, prescription.PatientID);

                if (!success)
                    return BadRequest(ApiResponse<PaymentDto>.ErrorResponse(message));

                return CreatedAtAction(nameof(GetById), new { id = data!.PaymentID },
                    ApiResponse<PaymentDto>.SuccessResponse(message, data));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CreatePaymentForPrescription: {ex.Message}");
                return StatusCode(500, ApiResponse<PaymentDto>.ErrorResponse("Failed to create payment"));
            }
        }

        // Utility endpoint to sync payments from existing prescriptions
        [HttpPost("sync-from-prescriptions")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<object>>> SyncPaymentsFromPrescriptions()
        {
            try
            {
                // Get all approved prescriptions that don't have payments
                var prescriptions = await _context.Prescriptions
                    .Include(p => p.Patient)
                    .Include(p => p.PrescriptionItems)
                        .ThenInclude(pi => pi.Medicine)
                    .Where(p => (p.Status == "Approved" || p.Status == "Paid" || p.Status == "Dispensed") 
                        && !_context.Payments.Any(pay => pay.PrescriptionID == p.PrescriptionID))
                    .ToListAsync();

                int createdCount = 0;
                var errors = new List<string>();

                foreach (var prescription in prescriptions)
                {
                    try
                    {
                        // Calculate total amount
                        var totalAmount = prescription.PrescriptionItems.Sum(pi => pi.Quantity * pi.Medicine.Price);

                        // Create payment with default values
                        var payment = new Payment
                        {
                            PatientID = prescription.PatientID,
                            PrescriptionID = prescription.PrescriptionID,
                            Amount = totalAmount,
                            Status = prescription.Status == "Dispensed" ? "Completed" : "Pending",
                            Method = "Cash", // Default method
                            TransactionRef = null,
                            PaymentDetails = $"Auto-created payment for prescription #{prescription.PrescriptionID}",
                            PaymentDate = prescription.CreatedDate,
                            CompletedDate = prescription.Status == "Dispensed" ? prescription.DispensedDate : null
                        };

                        _context.Payments.Add(payment);
                        createdCount++;
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Failed to create payment for Prescription #{prescription.PrescriptionID}: {ex.Message}");
                    }
                }

                if (createdCount > 0)
                {
                    await _context.SaveChangesAsync();
                }

                return Ok(ApiResponse<object>.SuccessResponse(
                    $"Successfully created {createdCount} payment(s). {errors.Count} error(s).",
                    new { Created = createdCount, Errors = errors.Count, ErrorMessages = errors }
                ));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SyncPaymentsFromPrescriptions: {ex.Message}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse($"Failed to sync payments: {ex.Message}"));
            }
        }
    }
}

