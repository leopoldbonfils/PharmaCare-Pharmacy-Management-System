using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;

namespace PharmaCareSystem.Api.Services
{
    public interface IPharmacistNotificationService
    {
        Task CheckAndNotifyLowStockAsync();
        Task CheckAndNotifyExpiringMedicinesAsync(int daysAhead = 90);
    }

    public class PharmacistNotificationService : IPharmacistNotificationService
    {
        private readonly PharmaCareDbContext _context;
        private readonly INotificationService _notificationService;

        public PharmacistNotificationService(
            PharmaCareDbContext context,
            INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task CheckAndNotifyLowStockAsync()
        {
            try
            {
                var lowStockMedicines = await _context.Medicines
                    .Where(m => m.IsActive && m.StockQuantity <= m.ReorderLevel)
                    .ToListAsync();

                if (lowStockMedicines.Any())
                {
                    // Get all active pharmacists
                    var pharmacists = await _context.Users
                        .Where(u => u.IsActive && string.Equals(u.Role, "Pharmacist", StringComparison.OrdinalIgnoreCase))
                        .ToListAsync();

                    foreach (var pharmacist in pharmacists)
                    {
                        await _notificationService.CreateNotificationAsync(
                            pharmacist.UserID,
                            "Low Stock Alert",
                            $"{lowStockMedicines.Count} medicine(s) have low stock and need to be reordered.",
                            "Warning",
                            "Medicine",
                            null,
                            null,
                            "/medicines?filter=lowStock"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CheckAndNotifyLowStockAsync: {ex.Message}");
            }
        }

        public async Task CheckAndNotifyExpiringMedicinesAsync(int daysAhead = 90)
        {
            try
            {
                var futureDate = DateTime.Now.AddDays(daysAhead);
                var expiringMedicines = await _context.Medicines
                    .Where(m => m.IsActive && m.ExpiryDate <= futureDate && m.ExpiryDate > DateTime.Now)
                    .ToListAsync();

                if (expiringMedicines.Any())
                {
                    // Get all active pharmacists
                    var pharmacists = await _context.Users
                        .Where(u => u.IsActive && string.Equals(u.Role, "Pharmacist", StringComparison.OrdinalIgnoreCase))
                        .ToListAsync();

                    foreach (var pharmacist in pharmacists)
                    {
                        await _notificationService.CreateNotificationAsync(
                            pharmacist.UserID,
                            "Medicine Expiring Soon",
                            $"{expiringMedicines.Count} medicine(s) will expire within {daysAhead} days.",
                            "Warning",
                            "Medicine",
                            null,
                            null,
                            "/medicines?filter=expiring"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CheckAndNotifyExpiringMedicinesAsync: {ex.Message}");
            }
        }
    }
}

