import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { validatePhone, validateEmail } from '../../utils/validation';

const PatientForm = ({ patient, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    phoneNumber: '',
    email: '',
    address: '',
    district: 'Gasabo',
    sector: '',
    emergencyContact: '',
    emergencyContactName: '',
    medicalHistory: '',
    allergies: '',
    bloodType: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const districts = ['Gasabo', 'Kicukiro', 'Nyarugenge', 'Kamonyi', 'Muhanga', 'Ruhango', 'Nyanza', 'Huye', 'Nyamagabe', 'Nyaruguru', 'Gisagara', 'Rusizi', 'Nyamasheke', 'Karongi', 'Rutsiro', 'Rubavu', 'Musanze', 'Burera', 'Gicumbi', 'Rulindo', 'Gakenke', 'Nyabihu'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  useEffect(() => {
    if (patient) {
      const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '';
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: dob,
        gender: patient.gender || 'Male',
        phoneNumber: patient.phoneNumber || '',
        email: patient.email || '',
        address: patient.address || '',
        district: patient.district || 'Gasabo',
        sector: patient.sector || '',
        emergencyContact: patient.emergencyContact || '',
        emergencyContactName: patient.emergencyContactName || '',
        medicalHistory: patient.medicalHistory || '',
        allergies: patient.allergies || '',
        bloodType: patient.bloodType || ''
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be in format 07XXXXXXXX';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.district) {
      newErrors.district = 'District is required';
    }

    if (!formData.sector.trim()) {
      newErrors.sector = 'Sector is required';
    }

    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Emergency contact is required';
    } else if (!validatePhone(formData.emergencyContact)) {
      newErrors.emergencyContact = 'Emergency contact must be in format 07XXXXXXXX';
    }

    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Convert date string to ISO format
      const submitData = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString()
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          error={errors.firstName}
        />

        {/* Last Name */}
        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          error={errors.lastName}
        />

        {/* Date of Birth */}
        <Input
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
          error={errors.dateOfBirth}
        />

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg transition-colors ${
              errors.gender ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            } focus:ring-2 focus:outline-none`}
          >
            {genders.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>

        {/* Phone Number */}
        <Input
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="07XXXXXXXX"
          required
          error={errors.phoneNumber}
        />

        {/* Email */}
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        {/* Address */}
        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          error={errors.address}
        />

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District <span className="text-red-500">*</span>
          </label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg transition-colors ${
              errors.district ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            } focus:ring-2 focus:outline-none`}
          >
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
        </div>

        {/* Sector */}
        <Input
          label="Sector"
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          required
          error={errors.sector}
        />

        {/* Emergency Contact */}
        <Input
          label="Emergency Contact"
          name="emergencyContact"
          value={formData.emergencyContact}
          onChange={handleChange}
          placeholder="07XXXXXXXX"
          required
          error={errors.emergencyContact}
        />

        {/* Emergency Contact Name */}
        <Input
          label="Emergency Contact Name"
          name="emergencyContactName"
          value={formData.emergencyContactName}
          onChange={handleChange}
          required
          error={errors.emergencyContactName}
        />

        {/* Blood Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blood Type
          </label>
          <select
            name="bloodType"
            value={formData.bloodType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="">Select Blood Type</option>
            {bloodTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Medical History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical History
        </label>
        <textarea
          name="medicalHistory"
          value={formData.medicalHistory}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder="Enter medical history..."
        />
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allergies
        </label>
        <textarea
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder="List any allergies..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : patient ? 'Update Patient' : 'Create Patient'}
        </Button>
      </div>
    </form>
  );
};

export default PatientForm;
