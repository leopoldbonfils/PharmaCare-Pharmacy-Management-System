using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Users;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(ApiResponse<List<UserDto>>.SuccessResponse("Users retrieved successfully", users));
        }

        [HttpGet("me")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound(ApiResponse<UserDto>.ErrorResponse("User not found"));

            return Ok(ApiResponse<UserDto>.SuccessResponse("User retrieved successfully", user));
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
                return NotFound(ApiResponse<UserDto>.ErrorResponse("User not found"));

            return Ok(ApiResponse<UserDto>.SuccessResponse("User retrieved successfully", user));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Create([FromBody] CreateUserDto dto)
        {
            var (success, message, data) = await _userService.CreateUserAsync(dto);

            if (!success)
                return BadRequest(ApiResponse<UserDto>.ErrorResponse(message));

            return CreatedAtAction(nameof(GetById), new { id = data!.UserID }, 
                ApiResponse<UserDto>.SuccessResponse(message, data));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] CreateUserDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            // Users can only update their own profile unless they're admin
            if (userRole != "Administrator" && userId != id)
                return Forbid("You can only update your own profile");

            // Don't allow password updates through this endpoint (use change-password)
            if (dto.Password != "unchanged" && dto.Password != null)
            {
                // If password is being changed, ignore it (use change-password endpoint instead)
                dto.Password = "unchanged";
            }

            var (success, message) = await _userService.UpdateUserAsync(id, dto);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        {
            var (success, message) = await _userService.DeleteUserAsync(id);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }
    }
}
