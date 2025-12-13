import api from './api';

export const saleService = {
  getAll: async () => {
    const response = await api.get('/sales');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  getByPatient: async (patientId) => {
    const response = await api.get(`/sales/patient/${patientId}`);
    return response.data;
  },

  create: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  completeFromMedicationRequest: async (medicationRequestId) => {
    const response = await api.post(`/sales/complete-from-medication-request/${medicationRequestId}`);
    return response.data;
  }
};
