import api from './api';

export const pharmacyService = {
  getAll: async () => {
    const response = await api.get('/pharmacies');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/pharmacies/${id}`);
    return response.data;
  }
};

