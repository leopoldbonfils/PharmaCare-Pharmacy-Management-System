import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { medicineService } from '../services/medicineService';
import { FaBars, FaBell, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, user]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const { notificationService } = await import('../services/notificationService');
      const { formatTimeAgo } = await import('../utils/formatDate');
      
      try {
        const response = await notificationService.getAll(true); // Get unread only
        if (response && response.success) {
          const notifs = (response.data || []).map(notif => ({
            id: notif.notificationID || notif.NotificationID,
            title: notif.title || notif.Title,
            message: notif.message || notif.Message,
            time: formatTimeAgo(notif.createdDate || notif.CreatedDate),
            unread: !(notif.isRead || notif.IsRead),
            type: notif.type || notif.Type || 'Info',
            createdDate: notif.createdDate || notif.CreatedDate
          }));
          setNotifications(notifs);
        } else {
          // Fallback to old method if API fails
          const notifs = [];
          if (user?.role === 'Patient') {
            const { prescriptionService } = await import('../services/prescriptionService');
            try {
              const presResponse = await prescriptionService.getAll();
              if (presResponse.success && presResponse.data) {
                const prescriptions = presResponse.data || [];
                const pendingPrescriptions = prescriptions.filter(p => p.status === 'Pending');
                const approvedPrescriptions = prescriptions.filter(p => p.status === 'Approved');
                
                if (pendingPrescriptions.length > 0) {
                  notifs.push({
                    id: 'pending-prescriptions',
                    title: 'Pending Prescriptions',
                    message: `You have ${pendingPrescriptions.length} prescription(s) pending approval`,
                    time: formatTimeAgo(new Date()),
                    unread: true
                  });
                }
                
                if (approvedPrescriptions.length > 0) {
                  notifs.push({
                    id: 'approved-prescriptions',
                    title: 'Approved Prescriptions',
                    message: `You have ${approvedPrescriptions.length} prescription(s) ready for pickup`,
                    time: formatTimeAgo(new Date()),
                    unread: true
                  });
                }
              }
            } catch (error) {
              console.error('Error fetching patient notifications:', error);
            }
          } else {
            const [lowStockRes, expiringRes] = await Promise.all([
              medicineService.getLowStock().catch(() => ({ success: false, data: [] })),
              medicineService.getExpiring(90).catch(() => ({ success: false, data: [] }))
            ]);
            
            if (lowStockRes.success && lowStockRes.data?.length > 0) {
              notifs.push({
                id: 'low-stock',
                title: 'Low Stock Alert',
                message: `${lowStockRes.data.length} medicine(s) have low stock`,
                time: formatTimeAgo(new Date()),
                unread: true
              });
            }

            if (expiringRes.success && expiringRes.data?.length > 0) {
              notifs.push({
                id: 'expiring',
                title: 'Medicine Expiring',
                message: `${expiringRes.data.length} medicine(s) expiring within 90 days`,
                time: formatTimeAgo(new Date()),
                unread: true
              });
            }
          }
          setNotifications(notifs);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <FaBars className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <p>Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${notification.unread ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-200">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl.startsWith('http') 
                    ? user.profileImageUrl 
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${user.profileImageUrl}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
              <span className="text-primary-600 font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaUser className="text-gray-500" />
                <span className="text-sm">Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaCog className="text-gray-500" />
                <span className="text-sm">Settings</span>
              </button>
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="text-red-500" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;