import api from './api';

export const userService = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  update: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/users/me/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};


