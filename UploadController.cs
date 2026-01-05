using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PharmaCareSystem.Api.Helpers;
using PharmaCareSystem.Api.Services;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IUserService _userService;

        public UploadController(IWebHostEnvironment environment, IUserService userService)
        {
            _environment = environment;
            _userService = userService;
        }

        [HttpPost("profile-image")]
        public async Task<ActionResult<ApiResponse<string>>> UploadProfileImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(ApiResponse<string>.ErrorResponse("No file uploaded"));

                if (file.Length > 2 * 1024 * 1024) // 2MB limit
                    return BadRequest(ApiResponse<string>.ErrorResponse("File size must be less than 2MB"));

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest(ApiResponse<string>.ErrorResponse("Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed"));

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "profiles");
                
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = $"profile_{userId}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/profiles/{fileName}";

                // Update user profile image URL
                var user = await _userService.GetUserByIdAsync(userId);
                if (user != null)
                {
                    var updateDto = new PharmaCareSystem.Api.DTOs.Users.CreateUserDto
                    {
                        Username = user.Username,
                        Email = user.Email,
                        Role = user.Role,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        PhoneNumber = user.PhoneNumber,
                        ProfileImageUrl = imageUrl,
                        Password = "unchanged"
                    };
                    await _userService.UpdateUserAsync(userId, updateDto);
                }

                return Ok(ApiResponse<string>.SuccessResponse("Profile image uploaded successfully", imageUrl));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse($"Failed to upload image: {ex.Message}"));
            }
        }

        [HttpPost("prescription-image")]
        public async Task<ActionResult<ApiResponse<string>>> UploadPrescriptionImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(ApiResponse<string>.ErrorResponse("No file uploaded"));

                if (file.Length > 5 * 1024 * 1024) // 5MB limit
                    return BadRequest(ApiResponse<string>.ErrorResponse("File size must be less than 5MB"));

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest(ApiResponse<string>.ErrorResponse("Invalid file type. Only JPG, JPEG, PNG, GIF, and PDF are allowed"));

                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "prescriptions");
                
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = $"prescription_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/prescriptions/{fileName}";

                return Ok(ApiResponse<string>.SuccessResponse("Prescription image uploaded successfully", imageUrl));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse($"Failed to upload image: {ex.Message}"));
            }
        }

        [HttpPost("message-attachment")]
        public async Task<ActionResult<ApiResponse<string>>> UploadMessageAttachment(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(ApiResponse<string>.ErrorResponse("No file uploaded"));

                if (file.Length > 10 * 1024 * 1024) // 10MB limit
                    return BadRequest(ApiResponse<string>.ErrorResponse("File size must be less than 10MB"));

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".txt" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest(ApiResponse<string>.ErrorResponse("Invalid file type. Allowed: JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, TXT"));

                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "messages");
                
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = $"message_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var fileUrl = $"/uploads/messages/{fileName}";

                return Ok(ApiResponse<string>.SuccessResponse("File uploaded successfully", fileUrl));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse($"Failed to upload file: {ex.Message}"));
            }
        }
    }
}

