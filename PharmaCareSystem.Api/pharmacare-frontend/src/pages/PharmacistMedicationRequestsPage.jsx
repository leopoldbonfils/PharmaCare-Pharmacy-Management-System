import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { medicationRequestService } from '../services/medicationRequestService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FaClipboardList, FaEye, FaCheck, FaTimes, FaEdit } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate';

const PharmacistMedicationRequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'modify'
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [modifiedItems, setModifiedItems] = useState([]);

  useEffect(() => {
    if (user?.userID) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await medicationRequestService.getAll(user.userID);
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

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setPharmacistNotes(request.pharmacistNotes || '');
    setModifiedItems(request.requestItems.map(item => ({
      ...item,
      approvedQuantity: item.requestedQuantity
    })));
    setShowActionModal(true);
  };

  const handleItemQuantityChange = (index, quantity) => {
    setModifiedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, approvedQuantity: parseInt(quantity) || 0 } : item
    ));
  };

  const handleSubmitAction = async () => {
    if (!selectedRequest) return;

    let status = '';
    if (actionType === 'approve') {
      status = 'Approved';
    } else if (actionType === 'reject') {
      status = 'Rejected';
    } else {
      status = 'Reviewed';
    }

    try {
      const modifiedItemsData = actionType === 'modify' 
        ? modifiedItems.map(item => ({
            requestItemID: item.requestItemID,
            approvedQuantity: item.approvedQuantity
          }))
        : null;

      const response = await medicationRequestService.updateStatus(
        selectedRequest.medicationRequestID,
        status,
        pharmacistNotes,
        selectedRequest.prescriptionID,
        modifiedItemsData
      );

      if (response && response.success) {
        toast.success(`Request ${status.toLowerCase()} successfully`);
        setShowActionModal(false);
        setSelectedRequest(null);
        setPharmacistNotes('');
        fetchRequests();
      } else {
        const errorMsg = response?.message || response?.Message || 'Error updating request';
        toast.error(errorMsg);
        console.error('Update error:', response);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.Message || error.message || 'Error updating request';
      toast.error(errorMsg);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    rejected: requests.filter(r => r.status === 'Rejected').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaClipboardList className="text-primary-600" />
            Medication Requests
          </h2>
          <p className="text-gray-600 mt-2">Review and manage medication requests from patients</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <p className="text-sm text-gray-600">Reviewed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
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
                placeholder="Search by symptoms, patient name, or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'reviewed', 'approved', 'rejected'].map((status) => (
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
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
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
                            Request #{request.medicationRequestID} - {request.patientName}
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
                          <strong>Patient:</strong> {request.patientName}
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
                          <p className="text-sm font-medium text-blue-900 mb-1">Your Notes:</p>
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
                      {request.status === 'Pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(request, 'approve')}
                            icon={<FaCheck />}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(request, 'reject')}
                            icon={<FaTimes />}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(request, 'modify')}
                            icon={<FaEdit />}
                          >
                            Modify
                          </Button>
                        </>
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
                  <p className="text-sm font-medium text-gray-700">Patient</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.patientName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Symptoms</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.symptoms}</p>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Patient Notes</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.notes}</p>
                </div>
              )}

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
                          <p className="text-sm text-gray-600">Price: ${item.unitPrice}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Action Modal */}
        <Modal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setSelectedRequest(null);
            setActionType('');
            setPharmacistNotes('');
          }}
          title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Request`}
          size="lg"
        >
          <div className="space-y-4">
            {actionType === 'modify' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Modify Quantities</p>
                <div className="space-y-3">
                  {modifiedItems.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{item.medicineName}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-600">Requested</label>
                          <p className="text-sm font-medium">{item.requestedQuantity}</p>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600">Approved Quantity</label>
                          <input
                            type="number"
                            min="0"
                            max={item.availableStock}
                            value={item.approvedQuantity}
                            onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600">Available Stock</label>
                          <p className="text-sm font-medium">{item.availableStock}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pharmacist Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={pharmacistNotes}
                onChange={(e) => setPharmacistNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder={actionType === 'reject' ? 'Please provide a reason for rejection...' : 'Add notes for the patient...'}
                required={actionType === 'reject'}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                  setActionType('');
                  setPharmacistNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAction}
                className={
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }
              >
                {actionType === 'approve' ? 'Approve' :
                 actionType === 'reject' ? 'Reject' :
                 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default PharmacistMedicationRequestsPage;

