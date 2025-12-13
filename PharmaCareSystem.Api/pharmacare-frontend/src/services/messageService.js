import api from './api';

export const messageService = {
  getAll: async (unreadOnly = false) => {
    const response = await api.get('/messages', { params: { unreadOnly } });
    return response.data;
  },

  getThreads: async () => {
    try {
      const response = await api.get('/messages/threads');
      return response.data;
    } catch (error) {
      console.error('Error fetching threads:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error loading message threads',
        data: []
      };
    }
  },

  getConversation: async (otherUserId) => {
    try {
      const response = await api.get(`/messages/conversation/${otherUserId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error loading conversation',
        data: null
      };
    }
  },

  getAvailableUsers: async () => {
    try {
      const response = await api.get('/messages/available-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching available users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error loading available users',
        data: []
      };
    }
  },

  send: async (receiverId, messageText, prescriptionId = null, messageType = 'General', attachmentUrl = null, replyToMessageID = null) => {
    try {
      const response = await api.post('/messages', {
        receiverID: receiverId,
        prescriptionID: prescriptionId,
        messageText: messageText,
        messageType: messageType,
        attachmentUrl: attachmentUrl,
        replyToMessageID: replyToMessageID
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error sending message',
        data: null
      };
    }
  },

  uploadAttachment: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/message-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error uploading attachment',
        data: null
      };
    }
  },

  markAsRead: async (messageId) => {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  }
};

