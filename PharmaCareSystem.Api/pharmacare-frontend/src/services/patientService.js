import api from './api';

export const patientService = {
  getAll: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  search: async (searchTerm) => {
    const response = await api.get(`/patients/search/${searchTerm}`);
    return response.data;
  },

  create: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  update: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  }
};