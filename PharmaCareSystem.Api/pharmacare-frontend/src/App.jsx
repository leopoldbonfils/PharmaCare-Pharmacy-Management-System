import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import PharmacistDashboard from './pages/dashboards/PharmacistDashboard';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import PatientsPage from './pages/PatientsPage';
import MedicinesPage from './pages/MedicinesPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import SalesPage from './pages/SalesPage';
import POSPage from './pages/POSPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PatientPrescriptionHistoryPage from './pages/PatientPrescriptionHistoryPage';
import MyMedicationRequestsPage from './pages/MyMedicationRequestsPage';
import CreateMedicationRequestPage from './pages/CreateMedicationRequestPage';
import PharmacistMedicationRequestsPage from './pages/PharmacistMedicationRequestsPage';
import PharmaciesPage from './pages/PharmaciesPage';
import PaymentsPage from './pages/PaymentsPage';
import PaymentCheckoutPage from './pages/PaymentCheckoutPage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Routes - Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Patients */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute roles={['Administrator', 'Pharmacist']}>
                  <PatientsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Medicines */}
            <Route
              path="/medicines"
              element={
                <ProtectedRoute>
                  <MedicinesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Prescriptions */}
            <Route
              path="/prescriptions"
              element={
                <ProtectedRoute roles={['Administrator', 'Pharmacist']}>
                  <PrescriptionsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Patient Prescription History */}
            <Route
              path="/prescriptions/history"
              element={
                <ProtectedRoute roles={['Patient']}>
                  <PatientPrescriptionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:patientId/prescriptions"
              element={
                <ProtectedRoute roles={['Administrator', 'Pharmacist']}>
                  <PatientPrescriptionHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Medication Requests */}
            <Route
              path="/medication-requests"
              element={
                <ProtectedRoute roles={['Patient', 'Pharmacist']}>
                  <MedicationRequestsRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medication-requests/create"
              element={
                <ProtectedRoute roles={['Patient']}>
                  <CreateMedicationRequestPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Pharmacies */}
            <Route
              path="/pharmacies"
              element={
                <ProtectedRoute roles={['Patient']}>
                  <PharmaciesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Payments */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute roles={['Patient']}>
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/checkout/:prescriptionId"
              element={
                <ProtectedRoute roles={['Patient']}>
                  <PaymentCheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/checkout"
              element={
                <ProtectedRoute roles={['Patient']}>
                  <PaymentCheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Messages */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Sales */}
            <Route
              path="/sales"
              element={
                <ProtectedRoute roles={['Administrator', 'Pharmacist']}>
                  <SalesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - POS */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute roles={['Administrator', 'Pharmacist']}>
                  <POSPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['Administrator', 'Pharmacist']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Admin Users */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['Administrator']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#363636',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'Administrator':
      return <AdminDashboard />;
    case 'Pharmacist':
      return <PharmacistDashboard />;
    case 'Patient':
      return <PatientDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

// Medication Requests Router Component
const MedicationRequestsRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'Pharmacist':
      return <PharmacistMedicationRequestsPage />;
    case 'Patient':
      return <MyMedicationRequestsPage />;
    default:
      return <Navigate to="/login" />;
  }
};

export default App;