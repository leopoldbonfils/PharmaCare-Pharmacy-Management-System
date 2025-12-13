import api from './api';

export const paymentService = {
  // Get current user's payments (recommended)
  getMyPayments: async () => {
    try {
      const response = await api.get('/payments/my-payments');
      return response.data;
    } catch (error) {
      console.error('Error fetching my payments:', error);
      throw error;
    }
  },

  // Get payments for a specific patient
  getPatientPayments: async (patientId) => {
    try {
      const response = await api.get(`/payments/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient payments:', error);
      throw error;
    }
  },

  // Get payments for a prescription
  getPrescriptionPayments: async (prescriptionId) => {
    try {
      const response = await api.get(`/payments/prescription/${prescriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription payments:', error);
      throw error;
    }
  },

  // Get payment by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Create a new payment
  create: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Update payment status (Admin/Pharmacist only)
  updateStatus: async (id, status, transactionRef) => {
    try {
      const response = await api.put(`/payments/${id}/status`, {
        status,
        transactionRef
      });
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
};

