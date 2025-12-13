import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { prescriptionService } from '../services/prescriptionService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaPrescriptionBottle, 
  FaEye, 
  FaUserMd, 
  FaCalendarAlt,
  FaFileImage,
  FaPills,
  FaCheckCircle
} from 'react-icons/fa';
import { formatDate, formatDateTime } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { PRESCRIPTION_STATUS } from '../utils/constants';

const PatientPrescriptionHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId, user]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const id = patientId || (user?.patientID);
      if (!id) {
        toast.error('Patient ID not found');
        return;
      }

      const response = await prescriptionService.getPatientPrescriptions(parseInt(id));
      if (response.success) {
        setPrescriptions(response.data || []);
      } else {
        toast.error(response.message || 'Error loading prescriptions');
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error(error.response?.data?.message || 'Error loading prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (prescriptionId) => {
    try {
      const response = await prescriptionService.getById(prescriptionId);
      if (response.success) {
        setSelectedPrescription(response.data);
        setShowDetailsModal(true);
      } else {
        toast.error(response.message || 'Error loading prescription details');
      }
    } catch (error) {
      console.error('Error fetching prescription details:', error);
      toast.error('Error loading prescription details');
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.createdByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionID.toString().includes(searchTerm);

    const matchesFilter = 
      filter === 'all' ||
      prescription.status.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Dispensed':
        return 'green';
      case 'Approved':
        return 'blue';
      case 'Pending':
        return 'yellow';
      case 'Cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter(p => p.status === 'Pending').length,
    approved: prescriptions.filter(p => p.status === 'Approved').length,
    dispensed: prescriptions.filter(p => p.status === 'Dispensed').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaPrescriptionBottle className="text-primary-600" />
            My Prescription History
          </h2>
          <p className="text-gray-600 mt-2">View all your prescriptions from all pharmacists</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaPrescriptionBottle className="text-3xl text-primary-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FaCalendarAlt className="text-3xl text-yellow-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <FaCheckCircle className="text-3xl text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispensed</p>
                <p className="text-2xl font-bold text-green-600">{stats.dispensed}</p>
              </div>
              <FaPills className="text-3xl text-green-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by diagnosis, doctor name, or prescription ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'dispensed', 'cancelled'].map((status) => (
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

        {/* Prescriptions List */}
        <Card>
          {loading ? (
            <Loader />
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaPrescriptionBottle className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No prescriptions found</p>
              <p className="text-sm mt-2">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Your prescriptions will appear here once created by a pharmacist'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <div
                  key={prescription.prescriptionID}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FaPrescriptionBottle className="text-primary-600 text-xl" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Prescription #{prescription.prescriptionID}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {prescription.diagnosis}
                          </p>
                        </div>
                        <Badge color={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaUserMd className="text-primary-600" />
                          <span>
                            <strong>Pharmacist:</strong> {prescription.createdByName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaCalendarAlt className="text-primary-600" />
                          <span>
                            <strong>Date:</strong> {formatDate(prescription.prescriptionDate)}
                          </span>
                        </div>
                        {prescription.prescriptionImageUrl && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaFileImage className="text-primary-600" />
                            <span className="text-green-600 font-medium">Image Available</span>
                          </div>
                        )}
                      </div>

                      {prescription.items && prescription.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Medicines ({prescription.items.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {prescription.items.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                              >
                                {item.medicineName} ({item.quantity}x)
                              </span>
                            ))}
                            {prescription.items.length > 3 && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                +{prescription.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(prescription.prescriptionID)}
                        icon={<FaEye />}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Prescription Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPrescription(null);
          }}
          title={`Prescription #${selectedPrescription?.prescriptionID}`}
          size="xl"
        >
          {selectedPrescription && (
            <div className="space-y-6">
              {/* Prescription Image */}
              {selectedPrescription.prescriptionImageUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Prescription Image</p>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={selectedPrescription.prescriptionImageUrl.startsWith('http')
                        ? selectedPrescription.prescriptionImageUrl
                        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${selectedPrescription.prescriptionImageUrl}`}
                      alt="Prescription"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <p className="text-sm text-gray-500 mt-2" style={{ display: 'none' }}>
                      Image not available
                    </p>
                  </div>
                </div>
              )}

              {/* Prescription Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                  <p className="text-gray-900 mt-1">{selectedPrescription.diagnosis}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge color={getStatusColor(selectedPrescription.status)} className="mt-1">
                    {selectedPrescription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Doctor Name</p>
                  <p className="text-gray-900 mt-1">{selectedPrescription.doctorName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Doctor Contact</p>
                  <p className="text-gray-900 mt-1">{selectedPrescription.doctorContact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Prescription Date</p>
                  <p className="text-gray-900 mt-1">{formatDate(selectedPrescription.prescriptionDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created By</p>
                  <p className="text-gray-900 mt-1">{selectedPrescription.createdByName}</p>
                </div>
              </div>

              {selectedPrescription.instructions && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Instructions</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedPrescription.instructions}</p>
                </div>
              )}

              {/* Medicines */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Medicines</p>
                <div className="space-y-3">
                  {selectedPrescription.items?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.medicineName}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.dosage} • {item.frequency} • {item.duration}
                          </p>
                          {item.instructions && (
                            <p className="text-sm text-gray-600 mt-1 italic">{item.instructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{item.quantity} units</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.totalPrice)}</p>
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

export default PatientPrescriptionHistoryPage;

