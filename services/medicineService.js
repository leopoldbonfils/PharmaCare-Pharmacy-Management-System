import api from './api';

export const medicineService = {
  getAll: async () => {
    const response = await api.get('/medicines');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },

  search: async (searchTerm) => {
    const response = await api.get(`/medicines/search/${searchTerm}`);
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get('/medicines/low-stock');
    return response.data;
  },

  getExpiring: async (days = 90) => {
    const response = await api.get(`/medicines/expiring/${days}`);
    return response.data;
  },

  create: async (medicineData) => {
    const response = await api.post('/medicines', medicineData);
    return response.data;
  },

  update: async (id, medicineData) => {
    const response = await api.put(`/medicines/${id}`, medicineData);
    return response.data;
  },

  updateStock: async (id, quantity, operation) => {
    const response = await api.patch(`/medicines/${id}/stock`, { quantity, operation });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
  }
};
