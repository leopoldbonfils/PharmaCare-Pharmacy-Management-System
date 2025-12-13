import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaUserShield, FaUserMd, FaUser } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate';
import { ROLES } from '../utils/constants';

const AdminUsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'Patient'
  });

  useEffect(() => {
    if (user?.role === 'Administrator') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/users', formData);
      if (response.data.success) {
        toast.success('User created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put(`/users/${selectedUser.userID}`, {
        ...formData,
        password: 'unchanged'
      });
      if (response.data.success) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await api.delete(`/users/${selectedUser.userID}`);
      if (response.data.success) {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'Patient'
    });
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Administrator':
        return <FaUserShield className="text-red-600" />;
      case 'Pharmacist':
        return <FaUserMd className="text-blue-600" />;
      case 'Patient':
        return <FaUser className="text-green-600" />;
      default:
        return <FaUser />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Administrator':
        return 'red';
      case 'Pharmacist':
        return 'blue';
      case 'Patient':
        return 'green';
      default:
        return 'gray';
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    administrators: users.filter(u => u.role === 'Administrator').length,
    pharmacists: users.filter(u => u.role === 'Pharmacist').length,
    patients: users.filter(u => u.role === 'Patient').length
  };

  if (user?.role !== 'Administrator') {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">Access denied. Administrator privileges required.</p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaUsers className="text-primary-600" />
              User Management
            </h2>
            <p className="text-gray-600 mt-2">Manage all users in the system</p>
          </div>
          <Button
            icon={<FaPlus />}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            Add User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaUsers className="text-3xl text-primary-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-red-600">{stats.administrators}</p>
              </div>
              <FaUserShield className="text-3xl text-red-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pharmacists</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pharmacists}</p>
              </div>
              <FaUserMd className="text-3xl text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patients</p>
                <p className="text-2xl font-bold text-green-600">{stats.patients}</p>
              </div>
              <FaUser className="text-3xl text-green-600" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <SearchBar
            placeholder="Search users by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Card>

        {/* Users Table */}
        <Card>
          {loading ? (
            <Loader />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.userID} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            {u.profileImageUrl ? (
                              <img 
                                src={u.profileImageUrl.startsWith('http') 
                                  ? u.profileImageUrl 
                                  : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${u.profileImageUrl}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-primary-600 font-semibold">
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-sm text-gray-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={getRoleBadgeColor(u.role)}>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(u.role)}
                            <span>{u.role}</span>
                          </div>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{u.email}</td>
                      <td className="py-3 px-4 text-gray-700">{u.phoneNumber}</td>
                      <td className="py-3 px-4 text-gray-700">{formatDate(u.createdDate)}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {u.lastLoginDate ? formatDate(u.lastLoginDate) : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create New User"
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
              placeholder="07XXXXXXXX"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="Patient">Patient</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            resetForm();
          }}
          title="Edit User"
          size="lg"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
              placeholder="07XXXXXXXX"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="Patient">Patient</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Leave password empty to keep current password. To change password, use the change password feature in user settings.
              </p>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          title="Delete User"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete user <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action will deactivate the user account. The user will not be able to log in.
            </p>
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;

