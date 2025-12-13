import React from 'react';
import { FaEdit, FaEye, FaTrash, FaWarehouse, FaCalendarAlt } from 'react-icons/fa';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loader from '../common/Loader';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

const MedicineTable = ({ medicines, onEdit, onView, onUpdateStock, onDelete, loading }) => {
  if (loading) return <Loader text="Loading medicines..." />;
  if (medicines.length === 0) {
    return <div className="text-center py-12"><p className="text-gray-500 text-lg">No medicines found</p></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {medicines.map((medicine) => (
            <tr key={medicine.medicineID} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{medicine.medicineName}</div>
                <div className="text-sm text-gray-500">{medicine.genericName}</div>
                <div className="text-xs text-gray-400">{medicine.category} • {medicine.dosage}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{medicine.manufacturer}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{medicine.batchNumber}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <FaWarehouse className={medicine.isLowStock ? 'text-red-500' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${medicine.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {medicine.stockQuantity}
                  </span>
                </div>
                {medicine.isLowStock && <div className="text-xs text-red-500">Reorder: {medicine.reorderLevel}</div>}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(medicine.price)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className={medicine.daysUntilExpiry <= 90 ? 'text-red-500' : 'text-gray-400'} />
                  <div>
                    <div className={`text-sm ${medicine.daysUntilExpiry <= 90 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {formatDate(medicine.expiryDate)}
                    </div>
                    <div className={`text-xs ${medicine.daysUntilExpiry <= 90 ? 'text-red-500' : 'text-gray-500'}`}>
                      {medicine.daysUntilExpiry} days
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {medicine.isLowStock && <Badge variant="warning">Low Stock</Badge>}
                {medicine.daysUntilExpiry <= 90 && medicine.daysUntilExpiry >= 0 && <Badge variant="danger" className="ml-1">Expiring</Badge>}
                {!medicine.isLowStock && medicine.daysUntilExpiry > 90 && <Badge variant="success">Active</Badge>}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView(medicine)} icon={<FaEye />} className="!p-2" />
                  <Button variant="outline" size="sm" onClick={() => onEdit(medicine)} icon={<FaEdit />} className="!p-2" />
                  <Button variant="outline" size="sm" onClick={() => onUpdateStock(medicine)} icon={<FaWarehouse />} className="!p-2" />
                  <Button variant="danger" size="sm" onClick={() => onDelete(medicine)} icon={<FaTrash />} className="!p-2" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicineTable;
