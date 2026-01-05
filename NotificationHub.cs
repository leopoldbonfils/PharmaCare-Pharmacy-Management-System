using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace PharmaCareSystem.Api.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            if (userId.HasValue)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId.Value}");
                _logger.LogInformation($"User {userId} connected to SignalR hub");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            if (userId.HasValue)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId.Value}");
                _logger.LogInformation($"User {userId} disconnected from SignalR hub");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(int receiverId, string message)
        {
            var senderId = GetUserId();
            if (!senderId.HasValue)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            await Clients.Group($"user_{receiverId}").SendAsync("ReceiveMessage", new
            {
                SenderID = senderId.Value,
                ReceiverID = receiverId,
                Message = message,
                Timestamp = DateTime.Now
            });
        }

        public async Task NotifyPrescriptionUpdate(int patientId, string status)
        {
            await Clients.Group($"user_{patientId}").SendAsync("PrescriptionUpdated", new
            {
                PatientID = patientId,
                Status = status,
                Timestamp = DateTime.Now
            });
        }

        public async Task NotifyNewMessage(int userId, int messageId, string senderName, string messagePreview)
        {
            await Clients.Group($"user_{userId}").SendAsync("NewMessage", new
            {
                MessageID = messageId,
                SenderName = senderName,
                MessagePreview = messagePreview,
                Timestamp = DateTime.Now
            });
        }

        private int? GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }
    }
}

