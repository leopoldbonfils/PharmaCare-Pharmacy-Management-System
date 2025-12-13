import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FaHome,
  FaUsers,
  FaPills,
  FaPrescriptionBottle,
  FaShoppingCart,
  FaStore,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaHospital,
  FaUserShield,
  FaComments
} from 'react-icons/fa';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard', roles: ['Administrator', 'Pharmacist', 'Patient'] },
    { path: '/admin/users', icon: FaUserShield, label: 'Users', roles: ['Administrator'] },
    { path: '/patients', icon: FaUsers, label: 'Patients', roles: ['Administrator', 'Pharmacist'] },
    { path: '/medicines', icon: FaPills, label: 'Medicines', roles: ['Administrator', 'Pharmacist'] },
    { 
      path: user?.role === 'Patient' ? '/prescriptions/history' : '/prescriptions', 
      icon: FaPrescriptionBottle, 
      label: user?.role === 'Patient' ? 'My Prescriptions' : 'Prescriptions', 
      roles: ['Administrator', 'Pharmacist', 'Patient'] 
    },
    { path: '/medication-requests', icon: FaPrescriptionBottle, label: 'Medication Requests', roles: ['Patient', 'Pharmacist'] },
    { path: '/messages', icon: FaComments, label: 'Messages', roles: ['Patient', 'Pharmacist'] },
    { path: '/pharmacies', icon: FaStore, label: 'Pharmacies', roles: ['Patient'] },
    { path: '/payments', icon: FaShoppingCart, label: 'Payments', roles: ['Patient'] },
    { path: '/sales', icon: FaShoppingCart, label: 'Sales', roles: ['Administrator', 'Pharmacist'] },
    { path: '/pos', icon: FaStore, label: 'POS', roles: ['Administrator', 'Pharmacist'] },
    { path: '/reports', icon: FaChartBar, label: 'Reports', roles: ['Administrator', 'Pharmacist'] },
    { path: '/settings', icon: FaCog, label: 'Settings', roles: ['Administrator', 'Pharmacist', 'Patient'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FaHospital className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold text-gray-900">PharmaCare</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl.startsWith('http') 
                    ? user.profileImageUrl 
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${user.profileImageUrl}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
              <span className="text-primary-600 font-semibold text-lg">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4">
          <ul className="space-y-1 px-3">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`text-lg ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;