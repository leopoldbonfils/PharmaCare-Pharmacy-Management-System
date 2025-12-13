import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import PatientTable from '../components/patients/PatientTable';
import PatientForm from '../components/patients/PatientForm';
import PatientDetails from '../components/patients/PatientDetails';
import { patientService } from '../services/patientService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FaPlus, FaUsers } from 'react-icons/fa';
import { useDebounce } from '../hooks/useDebounce';

const PatientsPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Fetch patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAll();
      if (response.success) {
        setPatients(response.data || []);
        setFilteredPatients(response.data || []);
      } else {
        toast.error(response.message || 'Failed to fetch patients');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error loading patients');
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const search = async () => {
      try {
        const response = await patientService.search(debouncedSearch);
        if (response.success) {
          setFilteredPatients(response.data || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to client-side search
        const filtered = patients.filter(patient =>
          `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          patient.phoneNumber.includes(debouncedSearch) ||
          (patient.email && patient.email.toLowerCase().includes(debouncedSearch.toLowerCase()))
        );
        setFilteredPatients(filtered);
      }
    };

    search();
  }, [debouncedSearch, patients]);

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle add patient
  const handleAdd = () => {
    setSelectedPatient(null);
    setShowAddModal(true);
  };

  // Handle edit patient
  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  // Handle view details
  const handleViewDetails = async (patient) => {
    try {
      const response = await patientService.getById(patient.patientID);
      if (response.success) {
        setSelectedPatient(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      toast.error('Failed to load patient details');
    }
  };

  // Handle delete patient
  const handleDeleteClick = (patient) => {
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPatient) return;

    try {
      const response = await patientService.delete(selectedPatient.patientID);
      if (response.success) {
        toast.success('Patient deleted successfully');
        setShowDeleteModal(false);
        setSelectedPatient(null);
        fetchPatients();
      } else {
        toast.error(response.message || 'Failed to delete patient');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting patient');
    }
  };

  // Handle form submit
  const handleFormSubmit = async (patientData) => {
    try {
      let response;
      if (selectedPatient) {
        // Update
        response = await patientService.update(selectedPatient.patientID, patientData);
      } else {
        // Create
        response = await patientService.create(patientData);
      }

      if (response.success) {
        toast.success(response.message || (selectedPatient ? 'Patient updated successfully' : 'Patient created successfully'));
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedPatient(null);
        fetchPatients();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving patient');
    }
  };

  if (loading && patients.length === 0) {
    return (
      <DashboardLayout>
        <Loader text="Loading patients..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaUsers className="text-primary-600" />
              Patients Management
            </h1>
            <p className="text-gray-600 mt-1">Manage patient records and information</p>
          </div>
          <Button onClick={handleAdd} icon={<FaPlus />}>
            Add New Patient
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Patients</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {patients.filter(p => p.isActive).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Active Patients</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{filteredPatients.length}</p>
              <p className="text-sm text-gray-600 mt-1">Filtered Results</p>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="mb-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search patients by name, phone, or email..."
            />
          </div>

          {/* Patient Table */}
          <PatientTable
            patients={filteredPatients}
            onEdit={handleEdit}
            onView={handleViewDetails}
            onDelete={handleDeleteClick}
            loading={loading}
          />
        </Card>

        {/* Add Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedPatient(null);
          }}
          title="Add New Patient"
          size="lg"
        >
          <PatientForm
            patient={null}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowAddModal(false);
              setSelectedPatient(null);
            }}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
          }}
          title="Edit Patient"
          size="lg"
        >
          <PatientForm
            patient={selectedPatient}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedPatient(null);
            }}
          />
        </Modal>

        {/* Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPatient(null);
          }}
          title="Patient Details"
          size="lg"
        >
          {selectedPatient && (
            <PatientDetails
              patient={selectedPatient}
              onEdit={() => {
                setShowDetailsModal(false);
                handleEdit(selectedPatient);
              }}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPatient(null);
          }}
          title="Delete Patient"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete patient{' '}
              <span className="font-semibold">
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPatient(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;
