using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Medicines;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MedicinesController : ControllerBase
    {
        private readonly IMedicineService _medicineService;

        public MedicinesController(IMedicineService medicineService)
        {
            _medicineService = medicineService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<MedicineDto>>>> GetAll()
        {
            var medicines = await _medicineService.GetAllMedicinesAsync();
            return Ok(ApiResponse<List<MedicineDto>>.SuccessResponse("Medicines retrieved successfully", medicines));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<MedicineDto>>> GetById(int id)
        {
            var medicine = await _medicineService.GetMedicineByIdAsync(id);
            if (medicine == null)
                return NotFound(ApiResponse<MedicineDto>.ErrorResponse("Medicine not found"));

            return Ok(ApiResponse<MedicineDto>.SuccessResponse("Medicine retrieved successfully", medicine));
        }

        [HttpGet("search/{searchTerm}")]
        public async Task<ActionResult<ApiResponse<List<MedicineDto>>>> Search(string searchTerm)
        {
            var medicines = await _medicineService.SearchMedicinesAsync(searchTerm);
            return Ok(ApiResponse<List<MedicineDto>>.SuccessResponse("Search completed", medicines));
        }

        [HttpGet("low-stock")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<MedicineDto>>>> GetLowStock()
        {
            var medicines = await _medicineService.GetLowStockMedicinesAsync();
            return Ok(ApiResponse<List<MedicineDto>>.SuccessResponse("Low stock medicines retrieved", medicines));
        }

        [HttpGet("expiring/{daysAhead}")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<List<MedicineDto>>>> GetExpiring(int daysAhead = 90)
        {
            var medicines = await _medicineService.GetExpiringMedicinesAsync(daysAhead);
            return Ok(ApiResponse<List<MedicineDto>>.SuccessResponse($"Medicines expiring within {daysAhead} days", medicines));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<MedicineDto>>> Create([FromBody] CreateMedicineDto dto)
        {
            var (success, message, data) = await _medicineService.CreateMedicineAsync(dto);

            if (!success)
                return BadRequest(ApiResponse<MedicineDto>.ErrorResponse(message));

            return CreatedAtAction(nameof(GetById), new { id = data!.MedicineID },
                ApiResponse<MedicineDto>.SuccessResponse(message, data));
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] CreateMedicineDto dto)
        {
            var (success, message) = await _medicineService.UpdateMedicineAsync(id, dto);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpPost("check-notifications")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> CheckNotifications([FromServices] IPharmacistNotificationService notificationService)
        {
            try
            {
                await notificationService.CheckAndNotifyLowStockAsync();
                await notificationService.CheckAndNotifyExpiringMedicinesAsync(90);
                return Ok(ApiResponse<object>.SuccessResponse("Notifications checked and sent", null));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse($"Error checking notifications: {ex.Message}"));
            }
        }

        [HttpPatch("{id}/stock")]
        [Authorize(Policy = "AdminOrPharmacist")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateStock(int id, [FromBody] UpdateStockRequest request)
        {
            var (success, message) = await _medicineService.UpdateStockAsync(id, request.Quantity, request.Operation);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        {
            var (success, message) = await _medicineService.DeleteMedicineAsync(id);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }
    }

    public class UpdateStockRequest
    {
        public int Quantity { get; set; }
        public string Operation { get; set; } = "ADD"; // ADD or SUBTRACT
    }
}
