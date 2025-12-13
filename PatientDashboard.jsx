import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import Card from '../../components/common/Card';
import { dashboardService } from '../../services/dashboardService';
import { prescriptionService } from '../../services/prescriptionService';
import { medicationRequestService } from '../../services/medicationRequestService';
import { paymentService } from '../../services/paymentService';
import { FaFilePrescription, FaPills, FaHistory, FaEye, FaClipboardList, FaCreditCard, FaStore } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/formatDate';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    activePrescriptions: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    paidPrescriptions: 0
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [assignedPharmacy, setAssignedPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.patientID) {
      fetchStats();
      fetchRecentPrescriptions();
      fetchRecentRequests();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const patientId = user?.patientID;
      if (!patientId) return;

      // Fetch prescriptions
      const presResponse = await prescriptionService.getAll();
      const prescriptions = presResponse.success ? (presResponse.data || []) : [];

      // Fetch medication requests
      const requestsResponse = await medicationRequestService.getPatientRequests(patientId);
      const requests = requestsResponse.success ? (requestsResponse.data || []) : [];

      // Fetch payments
      const paymentsResponse = await paymentService.getPatientPayments(patientId);
      const payments = paymentsResponse.success ? (paymentsResponse.data || []) : [];

      setStats({
        totalPrescriptions: prescriptions.length,
        activePrescriptions: prescriptions.filter(p => p.status === 'Pending' || p.status === 'Approved').length,
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'Pending').length,
        approvedRequests: requests.filter(r => r.status === 'Approved').length,
        paidPrescriptions: payments.filter(p => p.status === 'Completed').length
      });

      // Get assigned pharmacy from most recent request
      if (requests.length > 0) {
        const latestRequest = requests[0];
        setAssignedPharmacy({
          name: latestRequest.pharmacyName,
          pharmacist: latestRequest.pharmacistName
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error loading dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPrescriptions = async () => {
    try {
      const response = await prescriptionService.getAll();
      if (response.success && response.data) {
        const sorted = (response.data || [])
          .sort((a, b) => new Date(b.prescriptionDate) - new Date(a.prescriptionDate))
          .slice(0, 5);
        setRecentPrescriptions(sorted);
      }
    } catch (error) {
      console.error('Error fetching recent prescriptions:', error);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const patientId = user?.patientID;
      if (!patientId) return;

      const response = await medicationRequestService.getPatientRequests(patientId);
      if (response.success && response.data) {
        const sorted = (response.data || [])
          .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
          .slice(0, 5);
        setRecentRequests(sorted);
      }
    } catch (error) {
      console.error('Error fetching recent requests:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName || 'Patient'}!
          </h1>
          <p className="text-gray-600 mt-1">Manage your prescriptions and medications</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFilePrescription className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.activePrescriptions}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaPills className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalPrescriptions}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaHistory className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Past Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : (stats.totalPrescriptions - stats.activePrescriptions)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaClipboardList className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalRequests}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaClipboardList className="text-yellow-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.pendingRequests}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCreditCard className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.paidPrescriptions}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Assigned Pharmacy */}
        {assignedPharmacy && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaStore className="text-primary-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">My Pharmacy</p>
                  <p className="text-lg font-semibold text-gray-900">{assignedPharmacy.name}</p>
                  <p className="text-sm text-gray-600">Pharmacist: {assignedPharmacy.pharmacist}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/pharmacies')}>
                Change Pharmacy
              </Button>
            </div>
          </Card>
        )}

        {/* Recent Medication Requests */}
        {recentRequests.length > 0 && (
          <Card title="Recent Medication Requests">
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div
                  key={request.medicationRequestID}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <FaClipboardList className="text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Request #{request.medicationRequestID}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.symptoms.substring(0, 50)}... • {formatDate(request.requestDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/medication-requests')}
                      icon={<FaEye />}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate('/medication-requests')}
                  className="w-full"
                >
                  View All Requests
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Prescriptions */}
        <Card title="Recent Prescriptions">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : recentPrescriptions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
              No prescriptions yet. Your prescriptions will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {recentPrescriptions.map((prescription) => (
                <div
                  key={prescription.prescriptionID}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <FaFilePrescription className="text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Prescription #{prescription.prescriptionID}
                        </p>
                        <p className="text-sm text-gray-600">
                          {prescription.diagnosis} • {formatDate(prescription.prescriptionDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prescription.status === 'Dispensed' ? 'bg-green-100 text-green-800' :
                      prescription.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      prescription.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {prescription.status}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/prescriptions/history')}
                      icon={<FaEye />}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate('/prescriptions/history')}
                  className="w-full"
                >
                  View All Prescriptions
                </Button>
              </div>
          </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;

