using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Auth;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login([FromBody] LoginRequestDto request)
        {
            var (success, message, data) = await _authService.LoginAsync(request);

            if (!success)
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse(message));

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(message, data!));
        }

        [HttpPost("register-patient")]
        public async Task<ActionResult<ApiResponse<LoginResponseDto>>> RegisterPatient([FromBody] RegisterPatientDto request)
        {
            var (success, message, data) = await _authService.RegisterPatientAsync(request);

            if (!success)
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse(message));

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(message, data!));
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Register([FromBody] RegisterRequestDto request)
        {
            // Validate role
            if (string.IsNullOrEmpty(request.Role) || 
                (request.Role != "Patient" && request.Role != "Pharmacist" && request.Role != "Administrator"))
            {
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse("Invalid role. Must be Patient, Pharmacist, or Administrator"));
            }

            // Only allow Administrator registration if explicitly enabled (for security)
            if (request.Role == "Administrator")
            {
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse("Administrator accounts must be created by system administrators"));
            }

            var (success, message, data) = await _authService.RegisterUserAsync(request.Role, request);

            if (!success)
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse(message));

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(message, data!));
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            var (success, message) = await _authService.ForgotPasswordAsync(request.Email);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordDto request)
        {
            var (success, message) = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> ChangePassword([FromBody] ChangePasswordDto request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (success, message) = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }
    }
}