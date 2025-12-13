import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FaChartBar, 
  FaDownload, 
  FaFilePdf, 
  FaFileExcel, 
  FaPills, 
  FaDollarSign, 
  FaUsers, 
  FaBoxes,
  FaPrescriptionBottle,
  FaUserShield
} from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bestSelling, setBestSelling] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [monthlyPatients, setMonthlyPatients] = useState([]);
  const [stockValue, setStockValue] = useState(null);
  const [topPrescribed, setTopPrescribed] = useState([]);
  const [totalUsers, setTotalUsers] = useState(null);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const [bestSellingRes, revenueRes, patientsRes, stockRes, prescribedRes, usersRes] = await Promise.all([
        api.get('/reports/best-selling-medicines').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/monthly-revenue').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/monthly-patients').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/stock-value').catch(() => ({ data: { success: false, data: null } })),
        api.get('/reports/top-prescribed-medicines').catch(() => ({ data: { success: false, data: [] } })),
        user?.role === 'Administrator' 
          ? api.get('/reports/total-users').catch(() => ({ data: { success: false, data: null } }))
          : Promise.resolve({ data: { success: false, data: null } })
      ]);

      if (bestSellingRes.data.success) setBestSelling(bestSellingRes.data.data || []);
      if (revenueRes.data.success) setMonthlyRevenue(revenueRes.data.data || []);
      if (patientsRes.data.success) setMonthlyPatients(patientsRes.data.data || []);
      if (stockRes.data.success) setStockValue(stockRes.data.data);
      if (prescribedRes.data.success) setTopPrescribed(prescribedRes.data.data || []);
      if (usersRes.data.success) setTotalUsers(usersRes.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const content = generateReportHTML();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToExcel = () => {
    let csvContent = 'PharmaCare Reports\n\n';
    
    // Best Selling Medicines
    csvContent += 'Best Selling Medicines\n';
    csvContent += 'Medicine Name,Generic Name,Quantity Sold,Revenue\n';
    bestSelling.forEach(m => {
      csvContent += `"${m.medicineName}","${m.genericName}",${m.totalQuantitySold},${m.totalRevenue}\n`;
    });
    
    csvContent += '\nMonthly Revenue\n';
    csvContent += 'Year,Month,Revenue,Sales Count\n';
    monthlyRevenue.forEach(r => {
      csvContent += `${r.year},${r.month},${r.revenue},${r.salesCount}\n`;
    });
    
    csvContent += '\nTop Prescribed Medicines\n';
    csvContent += 'Medicine Name,Generic Name,Prescription Count,Total Quantity\n';
    topPrescribed.forEach(m => {
      csvContent += `"${m.medicineName}","${m.genericName}",${m.prescriptionCount},${m.totalQuantity}\n`;
    });

    if (stockValue) {
      csvContent += '\nStock Value\n';
      csvContent += `Total Stock Value,${stockValue.totalStockValue}\n`;
      csvContent += `Total Medicines,${stockValue.totalMedicines}\n`;
      csvContent += `Low Stock Count,${stockValue.lowStockCount}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacare-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PharmaCare Reports</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #22c55e; }
            h2 { color: #333; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #22c55e; color: white; }
            .chart { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>PharmaCare System Reports</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          <h2>Best Selling Medicines</h2>
          <table>
            <tr><th>Medicine</th><th>Generic Name</th><th>Quantity Sold</th><th>Revenue</th></tr>
            ${bestSelling.map(m => `<tr><td>${m.medicineName}</td><td>${m.genericName}</td><td>${m.totalQuantitySold}</td><td>${formatCurrency(m.totalRevenue)}</td></tr>`).join('')}
          </table>
          
          <h2>Monthly Revenue</h2>
          <table>
            <tr><th>Year</th><th>Month</th><th>Revenue</th><th>Sales Count</th></tr>
            ${monthlyRevenue.map(r => `<tr><td>${r.year}</td><td>${r.month}</td><td>${formatCurrency(r.revenue)}</td><td>${r.salesCount}</td></tr>`).join('')}
          </table>
          
          <h2>Top 5 Prescribed Medicines</h2>
          <table>
            <tr><th>Medicine</th><th>Generic Name</th><th>Prescription Count</th><th>Total Quantity</th></tr>
            ${topPrescribed.map(m => `<tr><td>${m.medicineName}</td><td>${m.genericName}</td><td>${m.prescriptionCount}</td><td>${m.totalQuantity}</td></tr>`).join('')}
          </table>
          
          ${stockValue ? `
          <h2>Stock Value</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Stock Value</td><td>${formatCurrency(stockValue.totalStockValue)}</td></tr>
            <tr><td>Total Medicines</td><td>${stockValue.totalMedicines}</td></tr>
            <tr><td>Low Stock Count</td><td>${stockValue.lowStockCount}</td></tr>
          </table>
          ` : ''}
          
          ${totalUsers ? `
          <h2>User Statistics</h2>
          <table>
            <tr><th>User Type</th><th>Count</th></tr>
            <tr><td>Total Users</td><td>${totalUsers.totalUsers}</td></tr>
            <tr><td>Administrators</td><td>${totalUsers.administrators}</td></tr>
            <tr><td>Pharmacists</td><td>${totalUsers.pharmacists}</td></tr>
            <tr><td>Patients</td><td>${totalUsers.patients}</td></tr>
          </table>
          ` : ''}
        </body>
      </html>
    `;
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || month;
  };

  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d[key] || 0));
  };

  const renderBarChart = (data, valueKey, labelKey, maxValue) => {
    if (!data || data.length === 0) return <p className="text-gray-500 text-center py-8">No data available</p>;
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0;
          const label = typeof labelKey === 'object' 
            ? `${item.year}-${getMonthName(item.month)}`
            : item[labelKey];
          return (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-32 text-sm text-gray-700 truncate">
                {label}
              </div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="text-white text-xs font-medium">
                      {typeof item[valueKey] === 'number' && item[valueKey] > 0
                        ? (valueKey.includes('Revenue') || valueKey.includes('Value')
                            ? formatCurrency(item[valueKey])
                            : item[valueKey].toLocaleString())
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaChartBar className="text-primary-600" />
            Reports & Analytics
            </h2>
            <p className="text-gray-600 mt-2">Comprehensive system reports and analytics</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              icon={<FaFileExcel />}
              onClick={exportToExcel}
            >
              Export Excel
            </Button>
            <Button
              icon={<FaFilePdf />}
              onClick={exportToPDF}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Stock Value Card */}
        {stockValue && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Stock Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stockValue.totalStockValue)}
                  </p>
                </div>
                <FaBoxes className="text-4xl text-primary-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Medicines</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stockValue.totalMedicines}
                  </p>
                </div>
                <FaPills className="text-4xl text-blue-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {stockValue.lowStockCount}
                  </p>
                </div>
                <FaBoxes className="text-4xl text-red-600" />
              </div>
            </Card>
          </div>
        )}

        {/* User Statistics (Admin Only) */}
        {user?.role === 'Administrator' && totalUsers && (
          <Card title="User Statistics" icon={<FaUserShield />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{totalUsers.totalUsers}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{totalUsers.administrators}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Pharmacists</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalUsers.pharmacists}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Patients</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{totalUsers.patients}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Selling Medicines */}
          <Card title="Best Selling Medicines" icon={<FaPills />}>
            {bestSelling.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available</p>
            ) : (
              <div className="space-y-4">
                {bestSelling.slice(0, 5).map((medicine, index) => {
                  const maxRevenue = getMaxValue(bestSelling, 'totalRevenue');
                  const percentage = maxRevenue > 0 ? (medicine.totalRevenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={medicine.medicineID} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{medicine.medicineName}</p>
                          <p className="text-sm text-gray-500">{medicine.genericName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-600">{formatCurrency(medicine.totalRevenue)}</p>
                          <p className="text-sm text-gray-500">{medicine.totalQuantitySold} units</p>
                        </div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Top 5 Prescribed Medicines */}
          <Card title="Top 5 Most Prescribed Medicines" icon={<FaPrescriptionBottle />}>
            {topPrescribed.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available</p>
            ) : (
              <div className="space-y-4">
                {topPrescribed.map((medicine, index) => {
                  const maxCount = getMaxValue(topPrescribed, 'prescriptionCount');
                  const percentage = maxCount > 0 ? (medicine.prescriptionCount / maxCount) * 100 : 0;
                  return (
                    <div key={medicine.medicineID} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{medicine.medicineName}</p>
                          <p className="text-sm text-gray-500">{medicine.genericName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{medicine.prescriptionCount} prescriptions</p>
                          <p className="text-sm text-gray-500">{medicine.totalQuantity} units</p>
                        </div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Monthly Revenue Chart */}
        <Card title="Monthly Revenue (Last 12 Months)" icon={<FaDollarSign />}>
          {renderBarChart(
            monthlyRevenue,
            'revenue',
            { year: 'year', month: 'month' },
            getMaxValue(monthlyRevenue, 'revenue')
          )}
        </Card>

        {/* Monthly Patients Chart */}
        <Card title="Monthly Patients Served (Last 12 Months)" icon={<FaUsers />}>
          {renderBarChart(
            monthlyPatients,
            'patientCount',
            { year: 'year', month: 'month' },
            getMaxValue(monthlyPatients, 'patientCount')
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
