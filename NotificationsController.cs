using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<object>>> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly);
            
            return Ok(ApiResponse<object>.SuccessResponse("Notifications retrieved successfully", notifications));
        }

        [HttpPut("{id}/read")]
        public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _notificationService.MarkAsReadAsync(id, userId);
            
            return Ok(ApiResponse<object>.SuccessResponse("Notification marked as read", null));
        }

        [HttpPut("read-all")]
        public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _notificationService.MarkAllAsReadAsync(userId);
            
            return Ok(ApiResponse<object>.SuccessResponse("All notifications marked as read", null));
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<ApiResponse<object>>> GetUnreadCount()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var count = await _notificationService.GetUnreadCountAsync(userId);
            
            return Ok(ApiResponse<object>.SuccessResponse("Unread count retrieved", new { count }));
        }
    }
}

