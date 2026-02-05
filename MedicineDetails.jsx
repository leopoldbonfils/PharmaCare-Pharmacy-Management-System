import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { FaCalendarAlt, FaWarehouse, FaMoneyBillWave, FaIndustry, FaFlask } from 'react-icons/fa';

const MedicineDetails = ({ medicine }) => {
  if (!medicine) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{medicine.medicineName}</h2>
          <p className="text-gray-600">{medicine.genericName}</p>
        </div>
        <div className="flex gap-2">
          {medicine.isLowStock && <Badge variant="warning">Low Stock</Badge>}
          {medicine.daysUntilExpiry <= 90 && <Badge variant="danger">Expiring Soon</Badge>}
          {medicine.isActive && <Badge variant="success">Active</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Basic Information">
          <div className="space-y-4">
            <div><p className="text-sm text-gray-500">Category</p><p className="font-medium">{medicine.category}</p></div>
            <div><p className="text-sm text-gray-500">Dosage</p><p className="font-medium">{medicine.dosage}</p></div>
            <div><p className="text-sm text-gray-500">Manufacturer</p><p className="font-medium">{medicine.manufacturer}</p></div>
            <div><p className="text-sm text-gray-500">Batch Number</p><p className="font-medium">{medicine.batchNumber}</p></div>
          </div>
        </Card>

        <Card title="Stock Information">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaWarehouse className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className={`font-medium text-xl ${medicine.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{medicine.stockQuantity}</p>
              </div>
            </div>
            <div><p className="text-sm text-gray-500">Reorder Level</p><p className="font-medium">{medicine.reorderLevel}</p></div>
            <div className="flex items-center gap-3">
              <FaMoneyBillWave className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium text-xl">{formatCurrency(medicine.price)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Expiry Information" className="md:col-span-2">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Expiry Date</p>
              <p className={`font-medium text-lg ${medicine.daysUntilExpiry <= 90 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(medicine.expiryDate)}
              </p>
              <p className={`text-sm ${medicine.daysUntilExpiry <= 90 ? 'text-red-500' : 'text-gray-500'}`}>
                {medicine.daysUntilExpiry} days until expiry
              </p>
            </div>
          </div>
        </Card>

        {medicine.description && (
          <Card title="Description" className="md:col-span-2">
            <p className="text-gray-900">{medicine.description}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicineDetails;
