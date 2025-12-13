namespace PharmaCareSystem.Api.Helpers
{
    public static class PasswordHasher
    {
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public static bool VerifyPassword(string password, string hashedPassword)
        {
            try
            {
                // Check if the stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
                if (hashedPassword.StartsWith("$2a$") || hashedPassword.StartsWith("$2b$") || hashedPassword.StartsWith("$2y$"))
                {
                    // It's a bcrypt hash, verify normally
                return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
                }
                else
                {
                    // It's plain text (for backward compatibility with manually inserted users)
                    // Compare plain text passwords
                    return password == hashedPassword;
                }
            }
            catch
            {
                // If verification fails, try plain text comparison as fallback
                return password == hashedPassword;
            }
        }
    }
}