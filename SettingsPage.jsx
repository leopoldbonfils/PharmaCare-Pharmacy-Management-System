// =============================================
// FILE: src/pages/SettingsPage.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { FaUser, FaLock, FaTrash, FaCamera, FaSave } from 'react-icons/fa';
import { validatePhone, validateEmail, validatePassword } from '../utils/validation';
import api from '../services/api';

const SettingsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });

  // Load profile image from user data
  useEffect(() => {
    if (user?.profileImageUrl) {
      // If image URL is relative, prepend API base URL
      const imageUrl = user.profileImageUrl.startsWith('http') 
        ? user.profileImageUrl 
        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${user.profileImageUrl}`;
      setProfileImage(imageUrl);
    } else {
      setProfileImage(null);
    }
  }, [user]);

  // Update profileData when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Validation
    if (!validateEmail(profileData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!validatePhone(profileData.phoneNumber)) {
      toast.error('Phone number must be in format 07XXXXXXXX');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/users/${user.userID}`, {
        email: profileData.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        username: user.username, // Keep username unchanged
        role: user.role, // Keep role unchanged
        password: 'unchanged' // Backend won't update password if this specific value is sent
      });

      if (response.data.success) {
        // Update local storage
        const updatedUser = {
          ...user,
          ...profileData
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Reload user data from backend to get latest
        try {
          const userResponse = await api.get('/users/me');
          if (userResponse.data.success) {
            localStorage.setItem('user', JSON.stringify(userResponse.data.data));
            refreshUser(); // Update AuthContext
          }
        } catch (err) {
          console.error('Error refreshing user data:', err);
          // Still update from local data
          refreshUser();
        }
        
        toast.success('Profile updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validation
    const { isValid, errors } = validatePassword(passwordData.newPassword);
    if (!isValid) {
      toast.error(errors[0]);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      // This would need a special password change endpoint
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'Patient' && user?.patientID) {
        // Delete patient record
        const response = await api.delete(`/patients/${user.patientID}`);
        
        if (response.data.success) {
          toast.success('Account deleted successfully');
          logout();
          navigate('/');
        } else {
          toast.error(response.data.message || 'Failed to delete account');
        }
      } else {
        toast.error('Only patients can delete their accounts');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Error deleting account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image size must be less than 2MB');
        return;
      }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const imageUrl = response.data.data;
        // Update user in localStorage
        const updatedUser = {
          ...user,
          profileImageUrl: imageUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        refreshUser();
        
        // Display the uploaded image
        const fullImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${imageUrl}`;
        setProfileImage(fullImageUrl);
        
        toast.success('Profile image uploaded successfully');
      } else {
        toast.error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Error uploading image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'password', label: 'Password', icon: <FaLock /> },
    { id: 'danger', label: 'Danger Zone', icon: <FaTrash /> }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FaUser className="text-primary-600" />
            </div>
            Settings
          </h2>
          <p className="text-gray-600 mt-2 ml-14">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-0">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card title="Profile Information" subtitle="Update your personal information">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-lg ring-4 ring-white">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-primary-600 font-semibold">
                            {user?.firstName?.[0]?.toUpperCase() || ''}{user?.lastName?.[0]?.toUpperCase() || ''}
                          </span>
                        )}
                      </div>
                      <label
                        htmlFor="profile-image"
                        className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl hover:scale-110"
                        title="Upload profile picture"
                      >
                        <FaCamera className="text-sm" />
                        <input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium mt-1">{user?.role}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Click the camera icon to upload a new profile photo
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone Number"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      required
                      placeholder="07XXXXXXXX"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      icon={<FaSave />}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <Card 
                title="Change Password" 
                subtitle="Update your password to keep your account secure"
                className="shadow-sm"
              >
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <Input
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>At least 6 characters long</li>
                      <li>Contains at least one uppercase letter</li>
                      <li>Contains at least one number</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={loading}
                      icon={<FaLock />}
                      className="min-w-[180px]"
                    >
                      {loading ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <Card className="shadow-sm">
                <div className="space-y-6">
                  <div className="border-l-4 border-l-red-500 bg-red-50 p-4 rounded-lg flex items-start gap-3">
                    <div className="p-1.5 bg-red-100 rounded-lg flex-shrink-0">
                      <FaTrash className="text-red-600 text-sm" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 mb-1">Danger Zone</h3>
                      <p className="text-red-700 text-sm leading-relaxed">
                      These actions are irreversible. Please be certain before proceeding.
                    </p>
                    </div>
                  </div>

                  {user?.role === 'Patient' ? (
                    <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <FaTrash className="text-red-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900">
                            Delete Account
                          </h4>
                          </div>
                          <p className="text-gray-600 mb-4 leading-relaxed">
                            Once you delete your account, there is no going back. All your data including prescriptions, medical records, and purchase history will be permanently deleted from our servers.
                          </p>
                          <Button
                            variant="danger"
                            icon={<FaTrash />}
                            onClick={() => setShowDeleteModal(true)}
                            className="hover:shadow-lg transition-shadow"
                          >
                            Delete My Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <div className="inline-block p-3 bg-gray-100 rounded-full mb-3">
                        <FaTrash className="text-gray-400 text-xl" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        Only patient accounts can be deleted.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Administrator and Pharmacist accounts must be managed by system administrators.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
        >
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Are you absolutely sure?</h4>
              <p className="text-red-700 text-sm">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700 font-medium">This will delete:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                <li>Your patient profile</li>
                <li>All prescriptions</li>
                <li>Purchase history</li>
                <li>Medical records</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={loading}
                icon={<FaTrash />}
              >
                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;