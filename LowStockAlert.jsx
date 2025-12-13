import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { medicineService } from '../../services/medicineService';
import { FaExclamationTriangle } from 'react-icons/fa';
import Loader from '../common/Loader';

const LowStockAlert = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const response = await medicineService.getLowStock();
      if (response.success) {
        setMedicines(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching low stock:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Low Stock Alerts">
      <div className="space-y-3">
        {loading ? (
          <Loader />
        ) : medicines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaExclamationTriangle className="mx-auto text-green-500 text-4xl mb-3" />
            <p>No low stock medicines at the moment</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {medicines.slice(0, 5).map((medicine) => (
              <div key={medicine.medicineID} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-gray-900">{medicine.medicineName}</p>
                <p className="text-sm text-gray-600">
                  Stock: {medicine.stockQuantity} / Reorder Level: {medicine.reorderLevel}
                </p>
              </div>
            ))}
            {medicines.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                +{medicines.length - 5} more medicines with low stock
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default LowStockAlert;

