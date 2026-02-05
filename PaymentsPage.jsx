import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCreditCard, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [location.pathname, location.key]); // Refresh when navigating to this page

  // Also refresh when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchPayments();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new endpoint that automatically gets current user's payments
      const response = await paymentService.getMyPayments();
      
      console.log('Payment response:', response); // Debug log
      
      if (response.success) {
        const paymentData = response.data || [];
        console.log('Payments data:', paymentData); // Debug log
        console.log('Payments count:', paymentData.length); // Debug log
        
        // Remove duplicates based on paymentID
        const uniquePayments = paymentData.filter((payment, index, self) =>
          index === self.findIndex(p => p.paymentID === payment.paymentID)
        );
        
        console.log('Unique payments count:', uniquePayments.length); // Debug log
        setPayments(uniquePayments);
        
        if (uniquePayments.length === 0) {
          console.log('No payments found for user');
          console.log('User info:', user); // Debug log
        } else {
          console.log('Payment statuses:', uniquePayments.map(p => ({ id: p.paymentID, status: p.status, prescriptionID: p.prescriptionID, medicationRequestID: p.medicationRequestID }))); // Debug log
        }
      } else {
        console.error('Payment API error:', response);
        setError(response.message || 'Error loading payments');
        toast.error(response.message || 'Error loading payments');
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load payments. Please try again.');
      toast.error('Error loading payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <FaCheckCircle className="text-green-600" />;
      case 'Failed':
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaClock className="text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'green';
      case 'Failed':
        return 'red';
      case 'Pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'Pending');
  const completedPayments = payments.filter(p => p.status === 'Completed');
  const failedPayments = payments.filter(p => p.status === 'Failed');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaCreditCard className="text-primary-600" />
            Payments
          </h2>
          <p className="text-gray-600 mt-2">View and manage your prescription and medication request payments</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <Card title="Pending Payments">
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.paymentID}
                  className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.prescriptionID 
                          ? `Prescription #${payment.prescriptionID}`
                          : payment.medicationRequestID 
                            ? `Medication Request #${payment.medicationRequestID}`
                            : 'Payment'
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        Amount: {formatCurrency(payment.amount)} • {formatDate(payment.paymentDate)}
                      </p>
                      {payment.method && (
                        <p className="text-xs text-gray-500 mt-1">Method: {payment.method}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        if (payment.prescriptionID) {
                          navigate(`/payments/checkout/${payment.prescriptionID}`);
                        } else if (payment.medicationRequestID) {
                          navigate(`/payments/checkout?medicationRequestId=${payment.medicationRequestID}`);
                        }
                      }}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Payment History */}
        <Card title="Payment History">
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaCreditCard className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm text-gray-400 mt-2">
                Your payments will appear here once you make a payment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Completed Payments */}
              {completedPayments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Completed Payments</h3>
                  {completedPayments.map((payment) => (
                <div
                  key={payment.paymentID}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.prescriptionID 
                            ? `Prescription #${payment.prescriptionID}`
                            : payment.medicationRequestID 
                              ? `Medication Request #${payment.medicationRequestID}`
                              : 'Payment'
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(payment.amount)} • {payment.method} • {formatDate(payment.completedDate || payment.paymentDate)}
                        </p>
                        {payment.transactionRef && (
                          <p className="text-xs text-gray-500 mt-1">Ref: {payment.transactionRef}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'Failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
                </div>
              )}

              {/* Failed Payments */}
              {failedPayments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Failed Payments</h3>
                  {failedPayments.map((payment) => (
                <div
                  key={payment.paymentID}
                  className="p-4 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.prescriptionID 
                            ? `Prescription #${payment.prescriptionID}`
                            : payment.medicationRequestID 
                              ? `Medication Request #${payment.medicationRequestID}`
                              : 'Payment'
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(payment.amount)} • {payment.method} • {formatDate(payment.paymentDate)}
                        </p>
                        {payment.transactionRef && (
                          <p className="text-xs text-gray-500 mt-1">Ref: {payment.transactionRef}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (payment.prescriptionID) {
                            navigate(`/payments/checkout/${payment.prescriptionID}`);
                          } else if (payment.medicationRequestID) {
                            navigate(`/payments/checkout?medicationRequestId=${payment.medicationRequestID}`);
                          }
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Summary Card */}
        {payments.length > 0 && (
          <Card title="Payment Summary">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{payments.length}</p>
                <p className="text-sm text-gray-600">Total Payments</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{completedPayments.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(completedPayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{failedPayments.length}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;

