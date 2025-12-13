import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { medicineService } from '../services/medicineService';
import toast from 'react-hot-toast';
import { FaPlus, FaPills, FaWarehouse, FaExclamationTriangle } from 'react-icons/fa';
import { useDebounce } from '../hooks/useDebounce';
import MedicineTable from '../components/medicines/MedicineTable';
import MedicineForm from '../components/medicines/MedicineForm';
import MedicineDetails from '../components/medicines/MedicineDetails';

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [filter, setFilter] = useState('all'); // all, lowStock, expiring

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await medicineService.getAll();
      if (response.success) {
        setMedicines(response.data || []);
        applyFilters(response.data || []);
      }
    } catch (error) {
      toast.error('Error loading medicines');
      setMedicines([]);
      setFilteredMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (meds) => {
    let filtered = [...meds];

    // Apply status filter
    if (filter === 'lowStock') {
      filtered = filtered.filter(m => m.isLowStock);
    } else if (filter === 'expiring') {
      filtered = filtered.filter(m => m.daysUntilExpiry <= 90 && m.daysUntilExpiry >= 0);
    }

    // Apply search
    if (debouncedSearch.trim()) {
      filtered = filtered.filter(m =>
        m.medicineName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        m.genericName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    setFilteredMedicines(filtered);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    applyFilters(medicines);
  }, [filter, debouncedSearch, medicines]);

  const handleFormSubmit = async (medicineData) => {
    try {
      let response;
      if (selectedMedicine) {
        response = await medicineService.update(selectedMedicine.medicineID, medicineData);
      } else {
        response = await medicineService.create(medicineData);
      }

      if (response.success) {
        toast.success(response.message || 'Medicine saved successfully');
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedMedicine(null);
        fetchMedicines();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving medicine');
    }
  };

  const handleStockUpdate = async (quantity, operation) => {
    if (!selectedMedicine) return;

    try {
      const response = await medicineService.updateStock(selectedMedicine.medicineID, quantity, operation);
      if (response.success) {
        toast.success('Stock updated successfully');
        setShowStockModal(false);
        setSelectedMedicine(null);
        fetchMedicines();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating stock');
    }
  };

  const handleDelete = async () => {
    if (!selectedMedicine) return;

    try {
      const response = await medicineService.delete(selectedMedicine.medicineID);
      if (response.success) {
        toast.success('Medicine deleted successfully');
        setShowDeleteModal(false);
        setSelectedMedicine(null);
        fetchMedicines();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting medicine');
    }
  };

  const lowStockCount = medicines.filter(m => m.isLowStock).length;
  const expiringCount = medicines.filter(m => m.daysUntilExpiry <= 90 && m.daysUntilExpiry >= 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaPills className="text-primary-600" />
              Medicines Inventory
            </h1>
            <p className="text-gray-600 mt-1">Manage medicine inventory and stock levels</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={<FaPlus />}>
            Add Medicine
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{medicines.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Medicines</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{lowStockCount}</p>
              <p className="text-sm text-gray-600 mt-1">Low Stock</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{expiringCount}</p>
              <p className="text-sm text-gray-600 mt-1">Expiring Soon</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{filteredMedicines.length}</p>
              <p className="text-sm text-gray-600 mt-1">Filtered Results</p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search medicines by name, generic name, or batch number..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'lowStock' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('lowStock')}
                icon={<FaExclamationTriangle />}
              >
                Low Stock
              </Button>
              <Button
                variant={filter === 'expiring' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('expiring')}
              >
                Expiring
              </Button>
            </div>
          </div>

          <MedicineTable
            medicines={filteredMedicines}
            onEdit={(m) => {
              setSelectedMedicine(m);
              setShowEditModal(true);
            }}
            onView={async (m) => {
              const response = await medicineService.getById(m.medicineID);
              if (response.success) {
                setSelectedMedicine(response.data);
                setShowDetailsModal(true);
              }
            }}
            onUpdateStock={(m) => {
              setSelectedMedicine(m);
              setShowStockModal(true);
            }}
            onDelete={(m) => {
              setSelectedMedicine(m);
              setShowDeleteModal(true);
            }}
            loading={loading}
          />
        </Card>

        {/* Add Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Medicine" size="lg">
          <MedicineForm onSubmit={handleFormSubmit} onCancel={() => setShowAddModal(false)} />
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedMedicine(null); }} title="Edit Medicine" size="lg">
          {selectedMedicine && <MedicineForm medicine={selectedMedicine} onSubmit={handleFormSubmit} onCancel={() => { setShowEditModal(false); setSelectedMedicine(null); }} />}
        </Modal>

        {/* Details Modal */}
        <Modal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedMedicine(null); }} title="Medicine Details" size="lg">
          {selectedMedicine && <MedicineDetails medicine={selectedMedicine} />}
        </Modal>

        {/* Stock Update Modal */}
        <Modal isOpen={showStockModal} onClose={() => { setShowStockModal(false); setSelectedMedicine(null); }} title="Update Stock" size="sm">
          {selectedMedicine && (
            <StockUpdateForm
              medicine={selectedMedicine}
              onSubmit={handleStockUpdate}
              onCancel={() => { setShowStockModal(false); setSelectedMedicine(null); }}
            />
          )}
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedMedicine(null); }} title="Delete Medicine" size="sm">
          <div className="space-y-4">
            <p className="text-gray-700">Are you sure you want to delete <span className="font-semibold">{selectedMedicine?.medicineName}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setSelectedMedicine(null); }}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

// Stock Update Form Component
const StockUpdateForm = ({ medicine, onSubmit, onCancel }) => {
  const [quantity, setQuantity] = useState('');
  const [operation, setOperation] = useState('ADD');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantity || parseInt(quantity) <= 0) return;
    onSubmit(parseInt(quantity), operation);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
        <select value={operation} onChange={(e) => setOperation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
          <option value="ADD">Add Stock</option>
          <option value="SUBTRACT">Subtract Stock</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        <p className="text-sm text-gray-500 mt-1">Current stock: {medicine.stockQuantity}</p>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Stock</Button>
      </div>
    </form>
  );
};

export default MedicinesPage;
