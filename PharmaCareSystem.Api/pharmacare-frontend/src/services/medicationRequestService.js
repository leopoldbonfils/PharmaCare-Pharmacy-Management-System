import api from './api';

export const medicationRequestService = {
  getAll: async (pharmacistId = null) => {
    const params = pharmacistId ? { pharmacistId } : {};
    const response = await api.get('/medicationrequests', { params });
    return response.data;
  },

  getPatientRequests: async (patientId) => {
    const response = await api.get(`/medicationrequests/patient/${patientId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/medicationrequests/${id}`);
    return response.data;
  },

  create: async (requestData) => {
    const response = await api.post('/medicationrequests', requestData);
    return response.data;
  },

  updateStatus: async (id, status, pharmacistNotes, prescriptionId = null, modifiedItems = null) => {
    try {
      // ASP.NET Core handles both camelCase and PascalCase, but let's use camelCase for consistency
      const response = await api.put(`/medicationrequests/${id}/status`, {
        status: status,
        pharmacistNotes: pharmacistNotes || '',
        prescriptionID: prescriptionId,
        modifiedItems: modifiedItems
      });
      return response.data;
    } catch (error) {
      console.error('Error updating medication request status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.Message || error.message || 'Error updating request';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  cancel: async (id) => {
    const response = await api.put(`/medicationrequests/${id}/cancel`);
    return response.data;
  },

  getAwaitingDispense: async (pharmacistId = null) => {
    const params = pharmacistId ? { pharmacistId } : {};
    const response = await api.get('/medicationrequests/awaiting-dispense', { params });
    return response.data;
  }
};

