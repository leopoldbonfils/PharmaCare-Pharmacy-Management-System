using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.DTOs.Pharmacies;

namespace PharmaCareSystem.Api.Services
{
    public interface IPharmacyService
    {
        Task<List<PharmacyDto>> GetAllPharmaciesAsync();
        Task<PharmacyDto?> GetPharmacyByIdAsync(int pharmacistId);
    }

    public class PharmacyService : IPharmacyService
    {
        private readonly PharmaCareDbContext _context;

        public PharmacyService(PharmaCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<PharmacyDto>> GetAllPharmaciesAsync()
        {
            return await _context.Users
                .Where(u => u.Role == "Pharmacist" && u.IsActive)
                .Select(u => new PharmacyDto
                {
                    PharmacistID = u.UserID,
                    PharmacistName = u.FirstName + " " + u.LastName,
                    PharmacyName = u.FirstName + " " + u.LastName + " Pharmacy", // Default name
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Location = "Kigali, Rwanda", // Default, can be extended with location field
                    Address = "Available on request", // Default
                    OpenHours = "Mon-Sat: 8:00 AM - 6:00 PM", // Default
                    IsActive = u.IsActive,
                    ImageUrl = u.ProfileImageUrl // Include the pharmacist's profile image
                })
                .OrderBy(p => p.PharmacistName)
                .ToListAsync();
        }

        public async Task<PharmacyDto?> GetPharmacyByIdAsync(int pharmacistId)
        {
            var user = await _context.Users
                .Where(u => u.UserID == pharmacistId && u.Role == "Pharmacist" && u.IsActive)
                .FirstOrDefaultAsync();

            if (user == null)
                return null;

            return new PharmacyDto
            {
                PharmacistID = user.UserID,
                PharmacistName = user.FirstName + " " + user.LastName,
                PharmacyName = user.FirstName + " " + user.LastName + " Pharmacy",
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Location = "Kigali, Rwanda",
                Address = "Available on request",
                OpenHours = "Mon-Sat: 8:00 AM - 6:00 PM",
                IsActive = user.IsActive,
                ImageUrl = user.ProfileImageUrl // Include the pharmacist's profile image
            };
        }
    }
}

