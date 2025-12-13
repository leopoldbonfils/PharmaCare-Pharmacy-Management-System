import api from './api';

export const prescriptionService = {
  getAll: async () => {
    const response = await api.get('/prescriptions');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },

  getByPatient: async (patientId) => {
    const response = await api.get(`/prescriptions/patient/${patientId}`);
    return response.data;
  },

  create: async (prescriptionData) => {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/prescriptions/${id}/status`, { status });
    return response.data;
  },

  getPatientPrescriptions: async (patientId) => {
    const response = await api.get(`/patients/${patientId}/prescriptions`);
    return response.data;
  },

  getPatientAlerts: async (patientId, prescriptionData) => {
    // Note: This endpoint expects query params, but we'll send as POST body for complex data
    const response = await api.post(`/patients/${patientId}/alerts`, prescriptionData);
    return response.data;
  }
};
