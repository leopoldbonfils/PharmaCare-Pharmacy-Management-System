using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.DTOs.Messages;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessagesController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<object>>> GetMessages([FromQuery] bool unreadOnly = false)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var messages = await _messageService.GetUserMessagesAsync(userId, unreadOnly);
            
            return Ok(ApiResponse<object>.SuccessResponse("Messages retrieved successfully", messages));
        }

        [HttpGet("threads")]
        public async Task<ActionResult<ApiResponse<object>>> GetThreads()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var threads = await _messageService.GetMessageThreadsAsync(userId);
            
            return Ok(ApiResponse<object>.SuccessResponse("Message threads retrieved successfully", threads));
        }

        [HttpGet("conversation/{otherUserId}")]
        public async Task<ActionResult<ApiResponse<object>>> GetConversation(int otherUserId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            try
            {
                var conversation = await _messageService.GetConversationAsync(userId, otherUserId);
                return Ok(ApiResponse<object>.SuccessResponse("Conversation retrieved successfully", conversation));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object>>> SendMessage([FromBody] SendMessageDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (string.IsNullOrWhiteSpace(dto.MessageText))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Message text is required"));
            }

            var (success, message, data) = await _messageService.SendMessageAsync(dto, userId);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return CreatedAtAction(nameof(GetMessages), new { },
                ApiResponse<object>.SuccessResponse(message, data));
        }

        [HttpPatch("{id}/read")]
        public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (success, message) = await _messageService.MarkAsReadAsync(id, userId);

            if (!success)
                return BadRequest(ApiResponse<object>.ErrorResponse(message));

            return Ok(ApiResponse<object>.SuccessResponse(message, null));
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<ApiResponse<object>>> GetUnreadCount()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var count = await _messageService.GetUnreadCountAsync(userId);
            
            return Ok(ApiResponse<object>.SuccessResponse("Unread count retrieved", new { count }));
        }

        [HttpGet("available-users")]
        public async Task<ActionResult<ApiResponse<object>>> GetAvailableUsers()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
                
                if (string.IsNullOrEmpty(userRole))
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse("User role not found"));
                }
                
                if (userId == 0)
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse("Invalid user ID"));
                }
                
                var users = await _messageService.GetAvailableUsersAsync(userId, userRole);
                
                return Ok(ApiResponse<object>.SuccessResponse("Available users retrieved", users));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAvailableUsers endpoint: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(ApiResponse<object>.ErrorResponse($"Error retrieving available users: {ex.Message}"));
            }
        }
    }
}

