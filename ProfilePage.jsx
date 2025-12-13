import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { patientService } from '../services/patientService';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaVenusMars } from 'react-icons/fa';

const ProfilePage = () => {
  const { user } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    district: '',
    sector: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    allergies: '',
    medicalHistory: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (user?.patientID) {
        try {
        const response = await patientService.getById(user.patientID);
        if (response.success && response.data) {
          const patient = response.data;
          setPatientData(patient);
          setFormData({
            firstName: patient.firstName || user.firstName || '',
            lastName: patient.lastName || user.lastName || '',
            email: patient.email || user.email || '',
            phoneNumber: patient.phoneNumber || user.phoneNumber || '',
            address: patient.address || '',
            district: patient.district || '',
            sector: patient.sector || '',
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
            gender: patient.gender || '',
            bloodType: patient.bloodType || '',
            allergies: patient.allergies || '',
            medicalHistory: patient.medicalHistory || ''
          });
            return;
        }
        } catch (patientError) {
          console.error('Error fetching patient data:', patientError);
          // Fall through to use user data
        }
      }
      
      // For all users (including non-patients), use user data
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          address: '',
          district: '',
          sector: '',
          dateOfBirth: '',
          gender: '',
          bloodType: '',
          allergies: '',
          medicalHistory: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user?.patientID) {
        const response = await patientService.update(user.patientID, formData);
        if (response.success) {
          toast.success('Profile updated successfully');
          setEditing(false);
          fetchProfile();
        } else {
          toast.error(response.message || 'Failed to update profile');
        }
      } else {
        // For non-patient users, update user profile via API
        const { default: api } = await import('../services/api');
        try {
          const response = await api.put(`/users/${user.userID}`, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            username: user.username,
            role: user.role,
            password: 'unchanged'
          });
          if (response.data.success) {
            // Update local storage
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success('Profile updated successfully');
            setEditing(false);
            fetchProfile();
          } else {
            toast.error(response.data.message || 'Failed to update profile');
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          toast.error(error.response?.data?.message || 'Error updating profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error updating profile');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaUser className="text-primary-600" />
            My Profile
          </h1>
          <p className="text-gray-600 mt-1">View and manage your profile information</p>
        </div>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {!editing && (
              <Button onClick={() => setEditing(true)} variant="primary" size="sm">
                Edit Profile
              </Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <input
                    type="text"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <FaUser className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {formData.firstName} {formData.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <FaEnvelope className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{formData.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <FaPhone className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-900">{formData.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
                {formData.dateOfBirth && (
                  <div className="flex items-center space-x-4">
                    <FaCalendar className="text-gray-400 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">
                        {new Date(formData.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {formData.gender && (
                  <div className="flex items-center space-x-4">
                    <FaVenusMars className="text-gray-400 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900">{formData.gender}</p>
                    </div>
                  </div>
                )}
                {formData.address && (
                  <div className="flex items-center space-x-4">
                    <FaMapMarkerAlt className="text-gray-400 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{formData.address}</p>
                    </div>
                  </div>
                )}
              </div>
              {formData.allergies && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
                  <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg">{formData.allergies}</p>
                </div>
              )}
              {formData.medicalHistory && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Medical History</p>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{formData.medicalHistory}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;

