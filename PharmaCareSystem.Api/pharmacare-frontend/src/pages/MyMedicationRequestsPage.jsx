import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { medicationRequestService } from '../services/medicationRequestService';
import { paymentService } from '../services/paymentService';
import { saleService } from '../services/saleService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';
import { FaClipboardList, FaEye, FaTimes, FaPlus, FaCreditCard, FaDownload, FaPrint } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate';

const MyMedicationRequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (user?.patientID) {
      fetchRequests();
    }
  }, [user]);

  // Refresh when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      if (user?.patientID) {
        fetchRequests();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await medicationRequestService.getPatientRequests(user.patientID);
      if (response.success) {
        setRequests(response.data || []);
      } else {
        toast.error(response.message || 'Error loading requests');
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Error loading medication requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (requestId) => {
    try {
      const response = await medicationRequestService.getById(requestId);
      if (response.success) {
        setSelectedRequest(response.data);
        setShowDetailsModal(true);
      } else {
        toast.error(response.message || 'Error loading request details');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Error loading request details');
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      const response = await medicationRequestService.cancel(requestId);
      if (response.success) {
        toast.success('Request cancelled successfully');
        fetchRequests();
      } else {
        toast.error(response.message || 'Error cancelling request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Error cancelling request');
    }
  };

  const handleDownloadReceipt = (sale) => {
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #10b981; margin: 0; }
          .header p { color: #6b7280; margin: 5px 0; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { }
          .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { font-size: 16px; font-weight: 600; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .total-row { font-weight: 600; font-size: 18px; }
          .total-amount { color: #10b981; font-size: 24px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PharmaCare</h1>
          <p>Pharmacy Management System</p>
          <p>Invoice: ${sale.invoiceNumber}</p>
        </div>
        <div class="info">
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${new Date(sale.saleDate).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Patient</div>
            <div class="info-value">${sale.patientName || 'Walk-in Customer'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${sale.paymentMethod}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Sold By</div>
            <div class="info-value">${sale.soldByName}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items?.map(item => `
              <tr>
                <td>
                  <strong>${item.medicineName}</strong><br>
                  <small style="color: #6b7280;">${item.genericName} - ${item.dosage}</small>
                </td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.totalPrice)}</td>
              </tr>
            `).join('') || ''}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 20px;">Total Amount:</td>
              <td class="total-amount">${formatCurrency(sale.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.pharmacistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.medicationRequestID.toString().includes(searchTerm);

    const matchesFilter = 
      filter === 'all' ||
      request.status.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'green';
      case 'Reviewed':
        return 'blue';
      case 'Pending':
        return 'yellow';
      case 'Rejected':
        return 'red';
      case 'Cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    reviewed: requests.filter(r => r.status === 'Reviewed').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    paid: requests.filter(r => r.status === 'Paid').length,
    dispensed: requests.filter(r => r.status === 'Dispensed').length,
    rejected: requests.filter(r => r.status === 'Rejected').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaClipboardList className="text-primary-600" />
              My Medication Requests
            </h2>
            <p className="text-gray-600 mt-2">View and manage your medication requests</p>
          </div>
          <Button onClick={() => navigate('/medication-requests/create')} icon={<FaPlus />}>
            New Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-blue-600">{stats.paid}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Dispensed</p>
              <p className="text-2xl font-bold text-purple-600">{stats.dispensed}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Reviewed</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.reviewed}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by symptoms, pharmacist, or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'reviewed', 'approved', 'paid', 'dispensed', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Requests List */}
        <Card>
          {loading ? (
            <Loader />
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaClipboardList className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No requests found</p>
              <p className="text-sm mt-2">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first medication request to get started'}
              </p>
              {!searchTerm && filter === 'all' && (
                <Button
                  className="mt-4"
                  onClick={() => navigate('/medication-requests/create')}
                  icon={<FaPlus />}
                >
                  Create Request
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.medicationRequestID}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FaClipboardList className="text-primary-600 text-xl" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Request #{request.medicationRequestID}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.symptoms.substring(0, 100)}{request.symptoms.length > 100 ? '...' : ''}
                          </p>
                        </div>
                        <Badge color={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="text-sm text-gray-600">
                          <strong>Pharmacist:</strong> {request.pharmacistName}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Date:</strong> {formatDate(request.requestDate)}
                        </div>
                        {request.requestItems && request.requestItems.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <strong>Medicines:</strong> {request.requestItems.length}
                          </div>
                        )}
                      </div>

                      {request.pharmacistNotes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">Pharmacist Notes:</p>
                          <p className="text-sm text-blue-800">{request.pharmacistNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request.medicationRequestID)}
                        icon={<FaEye />}
                      >
                        View
                      </Button>
                      {request.status === 'Approved' && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/payments/checkout?medicationRequestId=${request.medicationRequestID}`)}
                          icon={<FaCreditCard />}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Pay Now
                        </Button>
                      )}
                      {request.status === 'Dispensed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Find sale for this medication request
                            try {
                              const salesRes = await saleService.getByPatient(user.patientID);
                              if (salesRes.success) {
                                const sale = salesRes.data?.find(s => 
                                  s.notes?.includes(`Medication Request #${request.medicationRequestID}`)
                                );
                                if (sale) {
                                  handleDownloadReceipt(sale);
                                } else {
                                  toast.error('Receipt not found for this request');
                                }
                              }
                            } catch (error) {
                              toast.error('Error loading receipt');
                            }
                          }}
                          icon={<FaDownload />}
                        >
                          Download Receipt
                        </Button>
                      )}
                      {request.status === 'Pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(request.medicationRequestID)}
                          icon={<FaTimes />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Request Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
          title={`Request #${selectedRequest?.medicationRequestID}`}
          size="xl"
        >
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Image */}
              {selectedRequest.imageUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Image</p>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={selectedRequest.imageUrl.startsWith('http')
                        ? selectedRequest.imageUrl
                        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${selectedRequest.imageUrl}`}
                      alt="Request"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge color={getStatusColor(selectedRequest.status)} className="mt-1">
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Request Date</p>
                  <p className="text-gray-900 mt-1">{formatDate(selectedRequest.requestDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Pharmacist</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.pharmacistName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Pharmacy</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.pharmacyName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Symptoms</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.symptoms}</p>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Notes</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.pharmacistNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Pharmacist Notes</p>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{selectedRequest.pharmacistNotes}</p>
                </div>
              )}

              {/* Medicines */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Requested Medicines</p>
                <div className="space-y-3">
                  {selectedRequest.requestItems?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.medicineName}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.genericName}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{item.requestedQuantity} units</p>
                          <p className="text-sm text-gray-600">Available: {item.availableStock}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default MyMedicationRequestsPage;

