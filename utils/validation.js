export const validatePhone = (phone) => {
    const phoneRegex = /^07[0-9]{8}$/;
    return phoneRegex.test(phone);
  };
  
  export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return { isValid: errors.length === 0, errors };
  };