import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const MedicineForm = ({ medicine, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    stockQuantity: 0,
    reorderLevel: 10,
    price: 0,
    category: '',
    dosage: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const categories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'];

  useEffect(() => {
    if (medicine) {
      const expiry = medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '';
      setFormData({
        medicineName: medicine.medicineName || '',
        genericName: medicine.genericName || '',
        manufacturer: medicine.manufacturer || '',
        batchNumber: medicine.batchNumber || '',
        expiryDate: expiry,
        stockQuantity: medicine.stockQuantity || 0,
        reorderLevel: medicine.reorderLevel || 10,
        price: medicine.price || 0,
        category: medicine.category || '',
        dosage: medicine.dosage || '',
        description: medicine.description || ''
      });
    }
  }, [medicine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.medicineName.trim()) newErrors.medicineName = 'Required';
    if (!formData.genericName.trim()) newErrors.genericName = 'Required';
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Required';
    if (!formData.batchNumber.trim()) newErrors.batchNumber = 'Required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Required';
    if (!formData.category) newErrors.category = 'Required';
    if (!formData.dosage.trim()) newErrors.dosage = 'Required';
    if (formData.price < 0) newErrors.price = 'Must be positive';
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Must be positive';
    if (formData.reorderLevel < 1) newErrors.reorderLevel = 'Must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...formData,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      stockQuantity: parseInt(formData.stockQuantity),
      reorderLevel: parseInt(formData.reorderLevel),
      price: parseFloat(formData.price)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Medicine Name" name="medicineName" value={formData.medicineName} onChange={handleChange} required error={errors.medicineName} />
        <Input label="Generic Name" name="genericName" value={formData.genericName} onChange={handleChange} required error={errors.genericName} />
        <Input label="Manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required error={errors.manufacturer} />
        <Input label="Batch Number" name="batchNumber" value={formData.batchNumber} onChange={handleChange} required error={errors.batchNumber} />
        <Input label="Expiry Date" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} required error={errors.expiryDate} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
          <select name="category" value={formData.category} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg ${errors.category ? 'border-red-300' : 'border-gray-300'}`}>
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>
        <Input label="Dosage" name="dosage" value={formData.dosage} onChange={handleChange} required error={errors.dosage} placeholder="e.g., 500mg" />
        <Input label="Stock Quantity" name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required error={errors.stockQuantity} />
        <Input label="Reorder Level" name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} required error={errors.reorderLevel} />
        <Input label="Price (RWF)" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required error={errors.price} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{medicine ? 'Update' : 'Create'} Medicine</Button>
      </div>
    </form>
  );
};

export default MedicineForm;
