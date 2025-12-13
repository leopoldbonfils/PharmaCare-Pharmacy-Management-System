using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Sales;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SalesController : ControllerBase
    {
        private readonly ISaleService _saleService;

        public SalesController(ISaleService saleService)
        {
            _saleService = saleService;
        }

        [HttpGet]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<SaleDto>>>> GetAll()
        {
            var sales = await _saleService.GetAllSalesAsync();
            return Ok(ApiResponse<List<SaleDto>>.SuccessResponse("Sales retrieved successfully", sales));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<SaleDto>>> GetById(int id)
        {
            var sale = await _saleService.GetSaleByIdAsync(id);
            if (sale == null)
                return NotFound(ApiResponse<SaleDto>.ErrorResponse("Sale not found"));

            return Ok(ApiResponse<SaleDto>.SuccessResponse("Sale retrieved successfully", sale));
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<ApiResponse<List<SaleDto>>>> GetByPatient(int patientId)
        {
            var sales = await _saleService.GetSalesByPatientAsync(patientId);
            return Ok(ApiResponse<List<SaleDto>>.SuccessResponse("Patient sales retrieved", sales));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<SaleDto>>> Create([FromBody] CreateSaleDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (success, message, data) = await _saleService.CreateSaleAsync(dto, userId);

            if (!success)
                return BadRequest(ApiResponse<SaleDto>.ErrorResponse(message));

            return CreatedAtAction(nameof(GetById), new { id = data!.SaleID },
                ApiResponse<SaleDto>.SuccessResponse(message, data));
        }

        [HttpPost("complete-from-medication-request/{medicationRequestId}")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<SaleDto>>> CompleteFromMedicationRequest(int medicationRequestId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (success, message, data) = await _saleService.CompleteSaleFromMedicationRequestAsync(medicationRequestId, userId);

            if (!success)
                return BadRequest(ApiResponse<SaleDto>.ErrorResponse(message));

            return Ok(ApiResponse<SaleDto>.SuccessResponse(message, data));
        }
    }
}