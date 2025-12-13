import api from './api';

export const notificationService = {
  getAll: async (unreadOnly = false) => {
    const response = await api.get('/notifications', { params: { unreadOnly } });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

