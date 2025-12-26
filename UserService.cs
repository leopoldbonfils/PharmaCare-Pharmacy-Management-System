using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Users;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Services
{
    public interface IUserService
    {
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int userId);
        Task<(bool Success, string Message, UserDto? Data)> CreateUserAsync(CreateUserDto dto);
        Task<(bool Success, string Message)> UpdateUserAsync(int userId, CreateUserDto dto);
        Task<(bool Success, string Message)> DeleteUserAsync(int userId);
    }

    public class UserService : IUserService
    {
        private readonly PharmaCareDbContext _context;

        public UserService(PharmaCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .Where(u => u.IsActive)
                .Select(u => new UserDto
                {
                    UserID = u.UserID,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    PhoneNumber = u.PhoneNumber,
                    IsActive = u.IsActive,
                    CreatedDate = u.CreatedDate,
                    LastLoginDate = u.LastLoginDate,
                    ProfileImageUrl = u.ProfileImageUrl
                })
                .ToListAsync();
        }

        public async Task<UserDto?> GetUserByIdAsync(int userId)
        {
            return await _context.Users
                .Where(u => u.UserID == userId && u.IsActive)
                .Select(u => new UserDto
                {
                    UserID = u.UserID,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    PhoneNumber = u.PhoneNumber,
                    IsActive = u.IsActive,
                    CreatedDate = u.CreatedDate,
                    LastLoginDate = u.LastLoginDate,
                    ProfileImageUrl = u.ProfileImageUrl
                })
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Success, string Message, UserDto? Data)> CreateUserAsync(CreateUserDto dto)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                    return (false, "Username already exists", null);

                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                    return (false, "Email already exists", null);

                var user = new User
                {
                    Username = dto.Username,
                    PasswordHash = PasswordHasher.HashPassword(dto.Password),
                    Email = dto.Email,
                    Role = dto.Role,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    PhoneNumber = dto.PhoneNumber,
                    IsActive = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var result = new UserDto
                {
                    UserID = user.UserID,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    IsActive = user.IsActive,
                    CreatedDate = user.CreatedDate
                };

                return (true, "User created successfully", result);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to create user: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> UpdateUserAsync(int userId, CreateUserDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return (false, "User not found");

                // Check if email is already taken by another user
                if (dto.Email != user.Email && await _context.Users.AnyAsync(u => u.Email == dto.Email && u.UserID != userId))
                    return (false, "Email already exists");

                // Check if username is already taken by another user
                if (dto.Username != user.Username && await _context.Users.AnyAsync(u => u.Username == dto.Username && u.UserID != userId))
                    return (false, "Username already exists");

                // Update only allowed fields (don't update password, role, or username unless admin)
                user.Email = dto.Email;
                user.FirstName = dto.FirstName;
                user.LastName = dto.LastName;
                user.PhoneNumber = dto.PhoneNumber;
                if (!string.IsNullOrEmpty(dto.ProfileImageUrl))
                    user.ProfileImageUrl = dto.ProfileImageUrl;
                
                // Only update username and role if password is not "unchanged" (meaning it's an admin update)
                if (dto.Password != "unchanged" && dto.Password != null)
                {
                    // This shouldn't happen through the profile update, but handle it
                    user.Username = dto.Username;
                    user.Role = dto.Role;
                }

                await _context.SaveChangesAsync();
                return (true, "User updated successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to update user: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> DeleteUserAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return (false, "User not found");

                user.IsActive = false;
                await _context.SaveChangesAsync();
                return (true, "User deleted successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to delete user: {ex.Message}");
            }
        }
    }
}