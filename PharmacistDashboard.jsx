import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import ExpiringMedicines from '../../components/dashboard/ExpiringMedicines';
import RecentActivity from '../../components/dashboard/RecentActivity';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatCurrency';
import { FaUsers, FaPills, FaFilePrescription, FaDollarSign, FaClipboardList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { medicationRequestService } from '../../services/medicationRequestService';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';

const PharmacistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedicines: 0,
    totalPrescriptions: 0,
    todaySales: 0
  });
  const [medicationRequests, setMedicationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    fetchStats();
    if (user?.userID) {
      fetchMedicationRequests();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error loading dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicationRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await medicationRequestService.getAll(user.userID);
      if (response.success) {
        setMedicationRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching medication requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const pendingRequests = medicationRequests.filter(r => r.status === 'Pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacist Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Patients"
            value={loading ? "..." : stats.totalPatients.toString()}
            icon={<FaUsers className="text-blue-500" />}
            bgColor="bg-blue-50"
            textColor="text-blue-600"
          />
          <StatsCard
            title="Total Medicines"
            value={loading ? "..." : stats.totalMedicines.toString()}
            icon={<FaPills className="text-green-500" />}
            bgColor="bg-green-50"
            textColor="text-green-600"
          />
          <StatsCard
            title="Prescriptions"
            value={loading ? "..." : stats.totalPrescriptions.toString()}
            icon={<FaFilePrescription className="text-purple-500" />}
            bgColor="bg-purple-50"
            textColor="text-purple-600"
          />
          <StatsCard
            title="Today's Sales"
            value={loading ? "..." : formatCurrency(stats.todaySales)}
            icon={<FaDollarSign className="text-orange-500" />}
            bgColor="bg-orange-50"
            textColor="text-orange-600"
          />
          <StatsCard
            title="Pending Requests"
            value={loadingRequests ? "..." : pendingRequests.toString()}
            icon={<FaClipboardList className="text-yellow-500" />}
            bgColor="bg-yellow-50"
            textColor="text-yellow-600"
            onClick={() => navigate('/medication-requests')}
            clickable
          />
        </div>

        {/* Medication Requests Quick View */}
        {pendingRequests > 0 && (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaClipboardList className="text-yellow-600" />
                  {pendingRequests} Pending Medication Request{pendingRequests > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You have {pendingRequests} medication request{pendingRequests > 1 ? 's' : ''} waiting for your review.
                </p>
              </div>
              <Button onClick={() => navigate('/medication-requests')}>
                View Requests
              </Button>
            </div>
          </Card>
        )}

        {/* Alerts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LowStockAlert />
          <ExpiringMedicines />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default PharmacistDashboard;