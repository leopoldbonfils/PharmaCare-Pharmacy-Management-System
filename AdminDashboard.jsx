import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import ExpiringMedicines from '../../components/dashboard/ExpiringMedicines';
import RecentActivity from '../../components/dashboard/RecentActivity';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatCurrency';
import { FaUsers, FaPills, FaFilePrescription, FaDollarSign } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedicines: 0,
    totalPrescriptions: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            title="Total Sales"
            value={loading ? "..." : formatCurrency(stats.totalSales)}
            icon={<FaDollarSign className="text-orange-500" />}
            bgColor="bg-orange-50"
            textColor="text-orange-600"
          />
        </div>

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

export default AdminDashboard;

