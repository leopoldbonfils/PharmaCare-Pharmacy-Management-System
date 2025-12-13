export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PharmaCare';

export const ROLES = {
  ADMIN: 'Administrator',
  PHARMACIST: 'Pharmacist',
  PATIENT: 'Patient'
};

export const PRESCRIPTION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DISPENSED: 'Dispensed',
  CANCELLED: 'Cancelled'
};

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  MOMO: 'MoMo',
  CARD: 'Bank Card',
  INSURANCE: 'Insurance'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  MEDICINES: '/medicines',
  PRESCRIPTIONS: '/prescriptions',
  SALES: '/sales',
  POS: '/pos',
  REPORTS: '/reports',
  SETTINGS: '/settings'
};