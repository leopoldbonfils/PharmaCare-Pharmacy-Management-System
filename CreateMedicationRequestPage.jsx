import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { medicationRequestService } from '../services/medicationRequestService';
import { pharmacyService } from '../services/pharmacyService';
import { medicineService } from '../services/medicineService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FaPlus, FaTimes, FaUpload } from 'react-icons/fa';

const CreateMedicationRequestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pharmacistID: '',
    symptoms: '',
    imageUrl: '',
    notes: '',
    requestItems: []
  });
  const [pharmacies, setPharmacies] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
    // Load selected pharmacy from localStorage
    const selectedPharmacy = localStorage.getItem('selectedPharmacy');
    if (selectedPharmacy) {
      const pharmacy = JSON.parse(selectedPharmacy);
      setFormData(prev => ({ ...prev, pharmacistID: pharmacy.pharmacistID.toString() }));
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [pharmaciesRes, medicinesRes] = await Promise.all([
        pharmacyService.getAll(),
        medicineService.getAll()
      ]);

      if (pharmaciesRes.success) {
        setPharmacies(pharmaciesRes.data || []);
      }
      if (medicinesRes.success) {
        setMedicines((medicinesRes.data || []).filter(m => m.isActive && m.stockQuantity > 0));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/prescription-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, imageUrl: response.data.data }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      requestItems: [...prev.requestItems, { medicineID: '', requestedQuantity: 1, notes: '' }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      requestItems: prev.requestItems.map((item, i) => 
        i === index ? { ...item, [field]: field === 'requestedQuantity' ? parseInt(value) || 1 : value } : item
      )
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      requestItems: prev.requestItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pharmacistID) {
      toast.error('Please select a pharmacy');
      return;
    }

    if (!formData.symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    if (formData.requestItems.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }

    // Validate all items have medicine selected
    for (const item of formData.requestItems) {
      if (!item.medicineID) {
        toast.error('Please select a medicine for all items');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await medicationRequestService.create({
        patientID: user.patientID,
        pharmacistID: parseInt(formData.pharmacistID),
        symptoms: formData.symptoms,
        imageUrl: formData.imageUrl || null,
        notes: formData.notes || null,
        requestItems: formData.requestItems.map(item => ({
          medicineID: parseInt(item.medicineID),
          requestedQuantity: item.requestedQuantity,
          notes: item.notes || null
        }))
      });

      if (response.success) {
        toast.success('Medication request created successfully!');
        navigate('/medication-requests');
      } else {
        toast.error(response.message || 'Error creating request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error.response?.data?.message || 'Error creating medication request');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Create Medication Request</h2>
          <p className="text-gray-600 mt-2">Request medications from your selected pharmacy</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Pharmacy <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.pharmacistID}
                onChange={(e) => setFormData(prev => ({ ...prev, pharmacistID: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Choose a pharmacy...</option>
                {pharmacies.map(p => (
                  <option key={p.pharmacistID} value={p.pharmacistID}>
                    {p.pharmacyName} - {p.pharmacistName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Don't see your pharmacy? <button type="button" onClick={() => navigate('/pharmacies')} className="text-primary-600 hover:underline">Browse all pharmacies</button>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms / Health Issue <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Describe your symptoms or health issue..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Prescription Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {formData.imageUrl && (
                <p className="text-sm text-green-600 mt-2">✓ Image uploaded successfully</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Max 5MB. JPG, PNG, GIF, PDF allowed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Any additional information for the pharmacist..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Requested Medicines <span className="text-red-500">*</span>
                </label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} icon={<FaPlus />}>
                  Add Medicine
                </Button>
              </div>

              {formData.requestItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No medicines added yet</p>
                  <Button type="button" variant="outline" className="mt-4" onClick={handleAddItem} icon={<FaPlus />}>
                    Add First Medicine
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.requestItems.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Medicine</label>
                          <select
                            value={item.medicineID}
                            onChange={(e) => handleItemChange(index, 'medicineID', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                          >
                            <option value="">Select medicine...</option>
                            {medicines.map(m => (
                              <option key={m.medicineID} value={m.medicineID}>
                                {m.medicineName} (Stock: {m.stockQuantity})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.requestedQuantity}
                            onChange={(e) => handleItemChange(index, 'requestedQuantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Special instructions..."
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/medication-requests')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateMedicationRequestPage;

