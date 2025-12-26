using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Auth;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string Message, LoginResponseDto? Data)> LoginAsync(LoginRequestDto request);
        Task<(bool Success, string Message, LoginResponseDto? Data)> RegisterPatientAsync(RegisterPatientDto request);
        Task<(bool Success, string Message, LoginResponseDto? Data)> RegisterUserAsync(string role, RegisterPatientDto request);
        Task<(bool Success, string Message)> ForgotPasswordAsync(string email);
        Task<(bool Success, string Message)> ResetPasswordAsync(string token, string newPassword);
        Task<(bool Success, string Message)> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    }

    public class AuthService : IAuthService
    {
        private readonly PharmaCareDbContext _context;
        private readonly JwtHelper _jwtHelper;

        public AuthService(PharmaCareDbContext context, JwtHelper jwtHelper)
        {
            _context = context;
            _jwtHelper = jwtHelper;
        }

        public async Task<(bool Success, string Message, LoginResponseDto? Data)> LoginAsync(LoginRequestDto request)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Patient)
                    .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

                if (user == null)
                    return (false, "Invalid username or password", null);

                // Verify password (handles both hashed and plain text for backward compatibility)
                bool passwordValid = PasswordHasher.VerifyPassword(request.Password, user.PasswordHash);
                
                if (!passwordValid)
                    return (false, "Invalid username or password", null);

                // If password was stored as plain text, hash it now for security
                if (!user.PasswordHash.StartsWith("$2a$") && !user.PasswordHash.StartsWith("$2b$") && !user.PasswordHash.StartsWith("$2y$"))
                {
                    // Hash the user's input password (not the stored plain text)
                    user.PasswordHash = PasswordHasher.HashPassword(request.Password);
                    await _context.SaveChangesAsync();
                }

                user.LastLoginDate = DateTime.Now;
                await _context.SaveChangesAsync();

                var token = _jwtHelper.GenerateToken(user);

                var response = new LoginResponseDto
                {
                    Token = token,
                    UserID = user.UserID,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    PatientID = user.Patient?.PatientID,
                    ProfileImageUrl = user.ProfileImageUrl
                };

                return (true, "Login successful", response);
            }
            catch (Exception ex)
            {
                return (false, $"Login failed: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message, LoginResponseDto? Data)> RegisterPatientAsync(RegisterPatientDto request)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                    return (false, "Username already exists", null);

                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                    return (false, "Email already exists", null);

                var (isValid, errors) = ValidationHelper.ValidatePassword(request.Password);
                if (!isValid)
                    return (false, string.Join(", ", errors), null);

                var user = new User
                {
                    Username = request.Username,
                    PasswordHash = PasswordHasher.HashPassword(request.Password),
                    Email = request.Email,
                    Role = "Patient",
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    IsActive = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var patient = new Patient
                {
                    UserID = user.UserID,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    DateOfBirth = request.DateOfBirth ?? DateTime.Now.AddYears(-30),
                    Gender = request.Gender ?? "Male",
                    PhoneNumber = request.PhoneNumber,
                    Email = request.Email,
                    Address = request.Address ?? string.Empty,
                    District = request.District ?? string.Empty,
                    Sector = request.Sector ?? string.Empty,
                    EmergencyContact = request.EmergencyContact ?? string.Empty,
                    EmergencyContactName = request.EmergencyContactName ?? string.Empty,
                    MedicalHistory = request.MedicalHistory,
                    Allergies = request.Allergies,
                    BloodType = request.BloodType,
                    IsActive = true
                };

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                var token = _jwtHelper.GenerateToken(user);

                var response = new LoginResponseDto
                {
                    Token = token,
                    UserID = user.UserID,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    PatientID = patient.PatientID
                };

                return (true, "Registration successful", response);
            }
            catch (Exception ex)
            {
                return (false, $"Registration failed: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message, LoginResponseDto? Data)> RegisterUserAsync(string role, RegisterPatientDto request)
        {
            try
            {
                // Validate role
                if (string.IsNullOrEmpty(role) || 
                    (role != "Patient" && role != "Pharmacist" && role != "Administrator"))
                {
                    return (false, "Invalid role. Must be Patient, Pharmacist, or Administrator", null);
                }

                // Only allow Administrator registration if explicitly enabled (for security)
                if (role == "Administrator")
                {
                    return (false, "Administrator accounts must be created by system administrators", null);
                }

                if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                    return (false, "Username already exists", null);

                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                    return (false, "Email already exists", null);

                var (isValid, errors) = ValidationHelper.ValidatePassword(request.Password);
                if (!isValid)
                    return (false, string.Join(", ", errors), null);

                var user = new User
                {
                    Username = request.Username,
                    PasswordHash = PasswordHasher.HashPassword(request.Password),
                    Email = request.Email,
                    Role = role,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    IsActive = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Only create Patient record if role is Patient
                Patient? patient = null;
                if (role == "Patient")
                {
                    // Validate required patient fields
                    if (!request.DateOfBirth.HasValue)
                        return (false, "Date of birth is required for patients", null);
                    if (string.IsNullOrEmpty(request.Gender))
                        return (false, "Gender is required for patients", null);
                    if (string.IsNullOrEmpty(request.Address) || string.IsNullOrEmpty(request.District) || string.IsNullOrEmpty(request.Sector))
                        return (false, "Address information is required for patients", null);
                    if (string.IsNullOrEmpty(request.EmergencyContact) || string.IsNullOrEmpty(request.EmergencyContactName))
                        return (false, "Emergency contact information is required for patients", null);

                    patient = new Patient
                    {
                        UserID = user.UserID,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        DateOfBirth = request.DateOfBirth.Value,
                        Gender = request.Gender,
                        PhoneNumber = request.PhoneNumber,
                        Email = request.Email,
                        Address = request.Address ?? string.Empty,
                        District = request.District ?? string.Empty,
                        Sector = request.Sector ?? string.Empty,
                        EmergencyContact = request.EmergencyContact ?? string.Empty,
                        EmergencyContactName = request.EmergencyContactName ?? string.Empty,
                        MedicalHistory = request.MedicalHistory,
                        Allergies = request.Allergies,
                        BloodType = request.BloodType,
                        IsActive = true
                    };

                    _context.Patients.Add(patient);
                    await _context.SaveChangesAsync();
                }

                var token = _jwtHelper.GenerateToken(user);

                var response = new LoginResponseDto
                {
                    Token = token,
                    UserID = user.UserID,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    PatientID = patient?.PatientID
                };

                return (true, "Registration successful", response);
            }
            catch (Exception ex)
            {
                return (false, $"Registration failed: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> ForgotPasswordAsync(string email)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
                if (user == null)
                {
                    // Don't reveal if email exists for security
                    return (true, "If the email exists, a password reset link has been sent.");
                }

                // Generate a simple reset token (in production, use a more secure method and store in DB)
                var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{user.UserID}:{DateTime.UtcNow.AddHours(24):yyyyMMddHHmmss}"));
                
                // In production, send email with reset link
                // For now, we'll just return success - the frontend will handle the token
                // In a real system, you'd store this token in a PasswordResetTokens table
                
                return (true, $"Password reset token generated. Token: {token}"); // In production, don't return token
            }
            catch (Exception ex)
            {
                return (false, $"Failed to process password reset request: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> ResetPasswordAsync(string token, string newPassword)
        {
            try
            {
                // Decode token (in production, validate from database)
                var tokenBytes = Convert.FromBase64String(token);
                var tokenString = System.Text.Encoding.UTF8.GetString(tokenBytes);
                var parts = tokenString.Split(':');
                
                if (parts.Length != 2)
                    return (false, "Invalid reset token");

                var userId = int.Parse(parts[0]);
                var expiryDate = DateTime.ParseExact(parts[1], "yyyyMMddHHmmss", null);

                if (DateTime.UtcNow > expiryDate)
                    return (false, "Reset token has expired");

                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                    return (false, "Invalid reset token");

                var (isValid, errors) = ValidationHelper.ValidatePassword(newPassword);
                if (!isValid)
                    return (false, string.Join(", ", errors));

                user.PasswordHash = PasswordHasher.HashPassword(newPassword);
                await _context.SaveChangesAsync();

                return (true, "Password reset successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to reset password: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                    return (false, "User not found");

                if (!PasswordHasher.VerifyPassword(currentPassword, user.PasswordHash))
                    return (false, "Current password is incorrect");

                var (isValid, errors) = ValidationHelper.ValidatePassword(newPassword);
                if (!isValid)
                    return (false, string.Join(", ", errors));

                user.PasswordHash = PasswordHasher.HashPassword(newPassword);
                await _context.SaveChangesAsync();

                return (true, "Password changed successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to change password: {ex.Message}");
            }
        }
    }
}
