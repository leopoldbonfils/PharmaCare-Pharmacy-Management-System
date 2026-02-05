import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { medicineService } from '../../services/medicineService';
import { FaCalendarTimes } from 'react-icons/fa';
import { formatDate } from '../../utils/formatDate';
import Loader from '../common/Loader';

const ExpiringMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiring();
  }, []);

  const fetchExpiring = async () => {
    try {
      setLoading(true);
      const response = await medicineService.getExpiring(90);
      if (response.success) {
        setMedicines(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching expiring medicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Expiring Medicines">
      <div className="space-y-3">
        {loading ? (
          <Loader />
        ) : medicines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaCalendarTimes className="mx-auto text-green-500 text-4xl mb-3" />
            <p>No medicines expiring soon</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {medicines.slice(0, 5).map((medicine) => (
              <div key={medicine.medicineID} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-gray-900">{medicine.medicineName}</p>
                <p className="text-sm text-gray-600">
                  Expires: {formatDate(medicine.expiryDate)}
                  {medicine.daysUntilExpiry !== undefined && (
                    <span className="ml-2">({medicine.daysUntilExpiry} days)</span>
                  )}
                </p>
              </div>
            ))}
            {medicines.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                +{medicines.length - 5} more medicines expiring soon
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExpiringMedicines;

