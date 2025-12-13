using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Pharmacies;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PharmaciesController : ControllerBase
    {
        private readonly IPharmacyService _pharmacyService;

        public PharmaciesController(IPharmacyService pharmacyService)
        {
            _pharmacyService = pharmacyService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<PharmacyDto>>>> GetAll()
        {
            var pharmacies = await _pharmacyService.GetAllPharmaciesAsync();
            return Ok(ApiResponse<List<PharmacyDto>>.SuccessResponse("Pharmacies retrieved successfully", pharmacies));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PharmacyDto>>> GetById(int id)
        {
            var pharmacy = await _pharmacyService.GetPharmacyByIdAsync(id);
            if (pharmacy == null)
                return NotFound(ApiResponse<PharmacyDto>.ErrorResponse("Pharmacy not found"));

            return Ok(ApiResponse<PharmacyDto>.SuccessResponse("Pharmacy retrieved successfully", pharmacy));
        }
    }
}

