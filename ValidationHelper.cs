using System.Text.RegularExpressions;

namespace PharmaCareSystem.Api.Helpers
{
    public static class ValidationHelper
    {
        public static bool IsValidRwandaPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                return false;

            var regex = new Regex(@"^07[0-9]{8}$");
            return regex.IsMatch(phoneNumber);
        }

        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
                return false;

            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        public static (bool IsValid, List<string> Errors) ValidatePassword(string password)
        {
            var errors = new List<string>();

            if (string.IsNullOrEmpty(password))
            {
                errors.Add("Password is required");
                return (false, errors);
            }

            if (password.Length < 6)
                errors.Add("Password must be at least 6 characters");

            if (!password.Any(char.IsUpper))
                errors.Add("Password must contain at least one uppercase letter");

            if (!password.Any(char.IsDigit))
                errors.Add("Password must contain at least one number");

            return (errors.Count == 0, errors);
        }

        public static bool IsValidDateOfBirth(DateTime dateOfBirth)
        {
            return dateOfBirth.Date < DateTime.Now.Date;
        }

        public static bool IsValidExpiryDate(DateTime expiryDate)
        {
            return expiryDate.Date > DateTime.Now.Date;
        }
    }
}