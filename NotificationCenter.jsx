import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import { signalRService } from '../../services/signalRService';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { FaBell, FaCheck, FaCheckDouble, FaTimes } from 'react-icons/fa';
import Loader from '../common/Loader';
import Badge from '../common/Badge';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.userID && isOpen) {
      fetchNotifications();
      connectSignalR();
    }

    return () => {
      signalRService.off('NewNotification');
    };
  }, [user, isOpen]);

  const connectSignalR = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await signalRService.connect(token);

        // Listen for new notifications
        signalRService.on('NewNotification', (data) => {
          fetchNotifications();
        });
      }
    } catch (error) {
      console.error('SignalR connection error:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getAll(false);
      if (response.success) {
        setNotifications(response.data || []);
        const unread = (response.data || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        toast.error(response.message || 'Error loading notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.notificationID === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error marking notifications as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Success':
        return '✓';
      case 'Error':
        return '✕';
      case 'Warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'Success':
        return 'green';
      case 'Error':
        return 'red';
      case 'Warning':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaBell className="text-primary-600 text-xl" />
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <Badge color="red" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FaBell className="text-5xl text-gray-300 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm mt-2">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.notificationID}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      handleMarkAsRead(notification.notificationID);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notification.isRead
                          ? `bg-${getNotificationColor(notification.type)}-100`
                          : 'bg-gray-100'
                      }`}
                    >
                      <span
                        className={`text-lg ${
                          !notification.isRead
                            ? `text-${getNotificationColor(notification.type)}-600`
                            : 'text-gray-500'
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3
                            className={`font-semibold mb-1 ${
                              !notification.isRead
                                ? 'text-gray-900'
                                : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p
                            className={`text-sm ${
                              !notification.isRead
                                ? 'text-gray-700'
                                : 'text-gray-600'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.createdDate)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;

