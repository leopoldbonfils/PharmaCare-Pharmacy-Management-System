import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { prescriptionService } from '../services/prescriptionService';
import { patientService } from '../services/patientService';
import { medicineService } from '../services/medicineService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FaPrescriptionBottle, FaPlus, FaEye, FaCheckCircle } from 'react-icons/fa';
import { PRESCRIPTION_STATUS } from '../utils/constants';
import { formatDate, formatDateTime } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import PrescriptionAlerts from '../components/prescriptions/PrescriptionAlerts';

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [filter, setFilter] = useState('all');

  // Redirect patients to their history page
  useEffect(() => {
    if (user?.role === 'Patient') {
      navigate('/prescriptions/history', { replace: true });
    }
  }, [user, navigate]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await prescriptionService.getAll();
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

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (!searchTerm) return true;
    return (
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prescriptionID.toString().includes(searchTerm)
    );
  });

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await prescriptionService.updateStatus(id, status);
      if (response.success) {
        toast.success('Status updated successfully');
        fetchPrescriptions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      [PRESCRIPTION_STATUS.PENDING]: 'warning',
      [PRESCRIPTION_STATUS.APPROVED]: 'info',
      [PRESCRIPTION_STATUS.DISPENSED]: 'success',
      [PRESCRIPTION_STATUS.CANCELLED]: 'danger'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaPrescriptionBottle className="text-primary-600" />
              Prescriptions
            </h1>
            <p className="text-gray-600 mt-1">Manage prescriptions and dispensing</p>
          </div>
          {(user?.role === 'Administrator' || user?.role === 'Pharmacist') && (
            <Button onClick={() => setShowCreateModal(true)} icon={<FaPlus />}>
              Create Prescription
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card><div className="text-center"><p className="text-3xl font-bold">{prescriptions.length}</p><p className="text-sm text-gray-600 mt-1">Total</p></div></Card>
          <Card><div className="text-center"><p className="text-3xl font-bold text-yellow-600">{prescriptions.filter(p => p.status === PRESCRIPTION_STATUS.PENDING).length}</p><p className="text-sm text-gray-600 mt-1">Pending</p></div></Card>
          <Card><div className="text-center"><p className="text-3xl font-bold text-blue-600">{prescriptions.filter(p => p.status === PRESCRIPTION_STATUS.APPROVED).length}</p><p className="text-sm text-gray-600 mt-1">Approved</p></div></Card>
          <Card><div className="text-center"><p className="text-3xl font-bold text-green-600">{prescriptions.filter(p => p.status === PRESCRIPTION_STATUS.DISPENSED).length}</p><p className="text-sm text-gray-600 mt-1">Dispensed</p></div></Card>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1"><SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search prescriptions..." /></div>
            <div className="flex gap-2">
              <Button variant={filter === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
              <Button variant={filter === PRESCRIPTION_STATUS.PENDING ? 'primary' : 'outline'} size="sm" onClick={() => setFilter(PRESCRIPTION_STATUS.PENDING)}>Pending</Button>
              <Button variant={filter === PRESCRIPTION_STATUS.APPROVED ? 'primary' : 'outline'} size="sm" onClick={() => setFilter(PRESCRIPTION_STATUS.APPROVED)}>Approved</Button>
              <Button variant={filter === PRESCRIPTION_STATUS.DISPENSED ? 'primary' : 'outline'} size="sm" onClick={() => setFilter(PRESCRIPTION_STATUS.DISPENSED)}>Dispensed</Button>
            </div>
          </div>

          {loading ? <Loader /> : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-500">No prescriptions found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.prescriptionID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{prescription.prescriptionID}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{prescription.patientName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{prescription.doctorName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(prescription.prescriptionDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{prescription.diagnosis}</td>
                      <td className="px-6 py-4">{getStatusBadge(prescription.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={async () => {
                            const response = await prescriptionService.getById(prescription.prescriptionID);
                            if (response.success) {
                              setSelectedPrescription(response.data);
                              setShowDetailsModal(true);
                            }
                          }} icon={<FaEye />} className="!p-2" />
                          {prescription.status === PRESCRIPTION_STATUS.PENDING && (
                            <Button variant="success" size="sm" onClick={() => handleStatusUpdate(prescription.prescriptionID, PRESCRIPTION_STATUS.APPROVED)} icon={<FaCheckCircle />} className="!p-2">Approve</Button>
                          )}
                          {prescription.status === PRESCRIPTION_STATUS.APPROVED && (
                            <Button variant="success" size="sm" onClick={() => handleStatusUpdate(prescription.prescriptionID, PRESCRIPTION_STATUS.DISPENSED)} icon={<FaCheckCircle />} className="!p-2">Dispense</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Modal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedPrescription(null); }} title="Prescription Details" size="lg">
          {selectedPrescription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Patient</p><p className="font-medium">{selectedPrescription.patientName}</p></div>
                <div><p className="text-sm text-gray-500">Doctor</p><p className="font-medium">{selectedPrescription.doctorName}</p></div>
                <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formatDate(selectedPrescription.prescriptionDate)}</p></div>
                <div><p className="text-sm text-gray-500">Status</p>{getStatusBadge(selectedPrescription.status)}</div>
              </div>
              <div><p className="text-sm text-gray-500 mb-2">Diagnosis</p><p className="font-medium">{selectedPrescription.diagnosis}</p></div>
              {selectedPrescription.instructions && (
                <div><p className="text-sm text-gray-500 mb-2">Instructions</p><p className="text-gray-900">{selectedPrescription.instructions}</p></div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Medicines</p>
                <div className="space-y-2">
                  {selectedPrescription.items?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.medicineName}</p>
                          <p className="text-sm text-gray-600">{item.dosage} • {item.frequency} • {item.duration}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.quantity} units</p>
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

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Prescription" size="xl">
          <PrescriptionForm onCancel={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchPrescriptions(); }} />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

// Prescription Form Component
const PrescriptionForm = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientID: '',
    doctorName: '',
    doctorContact: '',
    hospitalName: '',
    diagnosis: '',
    instructions: '',
    prescriptionImageUrl: '',
    items: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        // Fetch medicines (available to all authenticated users)
        const medicinesRes = await medicineService.getAll();
        if (medicinesRes.success) {
          setMedicines(medicinesRes.data || []);
        } else {
          toast.error('Error loading medicines');
        }

        // Fetch patients (only for Admin/Pharmacist)
        if (user?.role === 'Administrator' || user?.role === 'Pharmacist') {
          try {
            const patientsRes = await patientService.getAll();
            if (patientsRes.success) {
              setPatients(patientsRes.data || []);
            }
          } catch (patientError) {
            console.error('Error loading patients:', patientError);
            // Don't show error if it's a permission issue
            if (patientError.response?.status !== 403) {
              toast.error('Error loading patients');
            }
            setPatients([]);
          }
        } else if (user?.patientID) {
          // If user is a patient, set their own patient ID
          setFormData(prev => ({ ...prev, patientID: user.patientID.toString() }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(error.response?.data?.message || 'Error loading data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { medicineID: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }]
    }));
  };

  const handleItemChange = async (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));

    // Fetch alerts when medicine is added/changed and patient is selected
    if (formData.patientID && (field === 'medicineID' || field === 'quantity')) {
      const patientId = parseInt(formData.patientID);
      if (patientId) {
        // Small delay to let state update
        setTimeout(async () => {
          await fetchAlerts(patientId);
        }, 300);
      }
    }
  };

  const fetchAlerts = async (patientId) => {
    if (!formData.patientID || formData.items.length === 0) {
      setAlerts([]);
      return;
    }

    try {
      setLoadingAlerts(true);
      const prescriptionData = {
        patientID: patientId,
        items: formData.items.map(item => ({
          medicineID: item.medicineID ? parseInt(item.medicineID) : 0,
          dosage: item.dosage || '',
          frequency: item.frequency || '',
          duration: item.duration || '',
          quantity: parseInt(item.quantity) || 1,
          instructions: item.instructions || ''
        }))
      };

      // Use POST to send prescription data for alert checking
      const response = await api.post(`/patients/${patientId}/alerts`, prescriptionData);
      if (response.data.success) {
        setAlerts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Don't show error toast for alerts, just log it
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/prescription-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          prescriptionImageUrl: response.data.data
        }));
        toast.success('Prescription image uploaded successfully');
      } else {
        toast.error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const patientId = user?.patientID || formData.patientID;
    
    if (!patientId || !formData.doctorName || !formData.doctorContact || !formData.diagnosis || formData.items.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await prescriptionService.create({
        ...formData,
        patientID: parseInt(patientId),
        prescriptionImageUrl: formData.prescriptionImageUrl || null,
        items: formData.items.map(item => ({
          ...item,
          medicineID: parseInt(item.medicineID),
          quantity: parseInt(item.quantity)
        }))
      });
      if (response.success) {
        toast.success('Prescription created successfully');
        onSuccess();
      } else {
        toast.error(response.message || 'Error creating prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error(error.response?.data?.message || 'Error creating prescription');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(user?.role === 'Administrator' || user?.role === 'Pharmacist') ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient <span className="text-red-500">*</span></label>
            <select 
              value={formData.patientID} 
              onChange={async (e) => {
                const patientId = e.target.value;
                setFormData(prev => ({ ...prev, patientID: patientId }));
                
                // Fetch alerts when patient is selected and form has data
                if (patientId && formData.items.length > 0) {
                  await fetchAlerts(parseInt(patientId));
                } else {
                  setAlerts([]);
                }
              }} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg" 
              required
            >
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.patientID} value={p.patientID}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
            <input 
              type="text" 
              value={user ? `${user.firstName} ${user.lastName}` : ''} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50" 
              disabled 
            />
            <p className="text-xs text-gray-500 mt-1">Your prescription will be created for your account</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name <span className="text-red-500">*</span></label>
          <input type="text" value={formData.doctorName} onChange={(e) => setFormData(prev => ({ ...prev, doctorName: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Contact <span className="text-red-500">*</span></label>
          <input type="text" value={formData.doctorContact} onChange={(e) => setFormData(prev => ({ ...prev, doctorContact: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
          <input type="text" value={formData.hospitalName} onChange={(e) => setFormData(prev => ({ ...prev, hospitalName: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis <span className="text-red-500">*</span></label>
        <input type="text" value={formData.diagnosis} onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
      </div>

      {/* Alerts Section */}
      {formData.patientID && alerts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Safety Alerts</label>
          <PrescriptionAlerts alerts={alerts} />
          <p className="text-xs text-gray-500 mt-2">
            Please review these alerts before creating the prescription. You can proceed, but ensure patient safety.
          </p>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
        <textarea value={formData.instructions} onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Prescription Image (Optional)</label>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleImageUpload}
            className="hidden"
            id="prescription-image-upload"
            disabled={uploadingImage}
          />
          <label
            htmlFor="prescription-image-upload"
            className={`px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploadingImage ? 'Uploading...' : 'Choose File'}
          </label>
          {formData.prescriptionImageUrl && (
            <span className="text-sm text-green-600">✓ Image uploaded</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Upload a scanned image or PDF of the paper prescription (max 5MB)</p>
      </div>
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">Medicines <span className="text-red-500">*</span></label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>Add Medicine</Button>
        </div>
        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select value={item.medicineID} onChange={(e) => handleItemChange(index, 'medicineID', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Medicine</option>
                  {medicines.map(m => <option key={m.medicineID} value={m.medicineID}>{m.medicineName}</option>)}
                </select>
                <input type="text" value={item.dosage} onChange={(e) => handleItemChange(index, 'dosage', e.target.value)} placeholder="Dosage" className="px-3 py-2 border border-gray-300 rounded-lg" required />
                <input type="text" value={item.frequency} onChange={(e) => handleItemChange(index, 'frequency', e.target.value)} placeholder="Frequency" className="px-3 py-2 border border-gray-300 rounded-lg" required />
                <input type="text" value={item.duration} onChange={(e) => handleItemChange(index, 'duration', e.target.value)} placeholder="Duration" className="px-3 py-2 border border-gray-300 rounded-lg" required />
                <div className="flex gap-2">
                  <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} placeholder="Qty" min="1" className="px-3 py-2 border border-gray-300 rounded-lg flex-1" required />
                  <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(index)} className="!p-2">×</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Prescription'}</Button>
      </div>
    </form>
  );
};

export default PrescriptionsPage;
