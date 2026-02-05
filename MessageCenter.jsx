import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { messageService } from '../../services/messageService';
import { signalRService } from '../../services/signalRService';
import { formatDate, formatTimeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { FaPaperPlane, FaSearch, FaUser, FaSpinner, FaPlus, FaPaperclip, FaSmile, FaReply, FaTimes, FaImage } from 'react-icons/fa';
import Loader from '../common/Loader';
import Modal from '../common/Modal';

const MessageCenter = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Common emojis
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  useEffect(() => {
    if (user?.userID) {
      fetchThreads();
      connectSignalR();
    }

    return () => {
      signalRService.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (selectedThread) {
      fetchConversation(selectedThread.otherUserID);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const connectSignalR = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await signalRService.connect(token);

        signalRService.on('NewMessage', (data) => {
          const senderId = data.SenderID || data.senderID;
          if (selectedThread && senderId === selectedThread.otherUserID) {
            fetchConversation(selectedThread.otherUserID);
          } else {
            fetchThreads();
          }
        });

        signalRService.on('ReceiveMessage', (data) => {
          const senderId = data.SenderID || data.senderID;
          if (selectedThread && senderId === selectedThread.otherUserID) {
            fetchConversation(selectedThread.otherUserID);
          } else {
            fetchThreads();
          }
        });
      }
    } catch (error) {
      console.error('SignalR connection error:', error);
    }
  };

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await messageService.getThreads();
      if (response && response.success) {
        const threadsData = response.data || [];
        const normalizedThreads = threadsData.map(thread => ({
          otherUserID: thread.otherUserID || thread.OtherUserID,
          otherUserName: thread.otherUserName || thread.OtherUserName,
          otherUserRole: thread.otherUserRole || thread.OtherUserRole,
          otherUserImageUrl: thread.otherUserImageUrl || thread.OtherUserImageUrl,
          unreadCount: thread.unreadCount || thread.UnreadCount || 0,
          lastMessage: thread.lastMessage || thread.LastMessage,
          lastMessageDate: thread.lastMessageDate || thread.LastMessageDate
        }));
        setThreads(normalizedThreads);
        if (!selectedThread && normalizedThreads.length > 0) {
          setSelectedThread(normalizedThreads[0]);
        }
      } else {
        const errorMsg = response?.message || 'Error loading messages';
        if (errorMsg !== 'Error loading messages' || threads.length === 0) {
          // Only show error if we don't have any threads
          console.error('Error fetching threads:', errorMsg);
        }
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      if (threads.length === 0) {
        toast.error('Error loading messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (otherUserId) => {
    try {
      const response = await messageService.getConversation(otherUserId);
      if (response && response.success) {
        const convData = response.data;
        const normalizedConv = {
          otherUserID: convData.otherUserID || convData.OtherUserID,
          otherUserName: convData.otherUserName || convData.OtherUserName,
          otherUserRole: convData.otherUserRole || convData.OtherUserRole,
          otherUserImageUrl: convData.otherUserImageUrl || convData.OtherUserImageUrl,
          unreadCount: convData.unreadCount || convData.UnreadCount || 0,
          messages: (convData.messages || convData.Messages || []).map(msg => ({
            messageID: msg.messageID || msg.MessageID,
            senderID: msg.senderID || msg.SenderID,
            senderName: msg.senderName || msg.SenderName,
            senderImageUrl: msg.senderImageUrl || msg.SenderImageUrl,
            receiverID: msg.receiverID || msg.ReceiverID,
            receiverName: msg.receiverName || msg.ReceiverName,
            messageText: msg.messageText || msg.MessageText,
            isRead: msg.isRead || msg.IsRead,
            sentDate: msg.sentDate || msg.SentDate,
            readDate: msg.readDate || msg.ReadDate,
            messageType: msg.messageType || msg.MessageType,
            replyToMessageID: msg.replyToMessageID || msg.ReplyToMessageID,
            replyToMessageText: msg.replyToMessageText || msg.ReplyToMessageText
          }))
        };
        setConversation(normalizedConv);
        const unreadMessages = normalizedConv.messages.filter(
          m => !m.isRead && m.receiverID === user.userID
        );
        for (const msg of unreadMessages) {
          await messageService.markAsRead(msg.messageID);
        }
        fetchThreads();
      } else {
        toast.error(response?.message || 'Error loading conversation');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Error loading conversation');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await messageService.getAvailableUsers();
      console.log('Available users response:', response);
      if (response && response.success) {
        const usersData = response.data || [];
        console.log('Users data:', usersData);
        if (Array.isArray(usersData) && usersData.length > 0) {
          setAvailableUsers(usersData.map(u => {
            // Handle both anonymous object and dictionary responses
            const userObj = typeof u === 'object' ? u : {};
            return {
              userID: userObj.userID || userObj.UserID || userObj.userID,
              firstName: userObj.firstName || userObj.FirstName || '',
              lastName: userObj.lastName || userObj.LastName || '',
              fullName: userObj.fullName || userObj.FullName || `${userObj.firstName || userObj.FirstName || ''} ${userObj.lastName || userObj.LastName || ''}`.trim(),
              role: userObj.role || userObj.Role || '',
              profileImageUrl: userObj.profileImageUrl || userObj.ProfileImageUrl || null,
              email: userObj.email || userObj.Email || ''
            };
          }));
        } else {
          setAvailableUsers([]);
          toast.info('No users available to message');
        }
      } else {
        const errorMsg = response?.message || 'Error loading users';
        console.error('Error response:', errorMsg);
        toast.error(errorMsg);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast.error(error.response?.data?.message || 'Error loading users');
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleStartConversation = async (selectedUser) => {
    try {
      if (!selectedUser || !selectedUser.userID) {
        toast.error('Invalid user selected');
        return;
      }

      // Check if thread already exists
      const existingThread = threads.find(t => t.otherUserID === selectedUser.userID);
      if (existingThread) {
        setSelectedThread(existingThread);
        // Fetch the conversation to load messages
        await fetchConversation(selectedUser.userID);
      } else {
        // Create new thread by selecting the user
        const newThread = {
          otherUserID: selectedUser.userID,
          otherUserName: selectedUser.fullName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim(),
          otherUserRole: selectedUser.role,
          otherUserImageUrl: selectedUser.profileImageUrl,
          unreadCount: 0,
          lastMessage: null,
          lastMessageDate: null
        };
        setSelectedThread(newThread);
        setThreads(prev => [newThread, ...prev]);
        // Fetch the conversation (might be empty, but that's okay)
        await fetchConversation(selectedUser.userID);
      }
      setShowUserSelect(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error(error.response?.data?.message || 'Error starting conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;
    if (!selectedThread) {
      toast.error('Please select a conversation');
      return;
    }

    try {
      setSending(true);
      
      let attachmentUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        try {
          const uploadResponse = await messageService.uploadAttachment(selectedFile);
          if (uploadResponse && uploadResponse.success) {
            attachmentUrl = uploadResponse.data;
          } else {
            toast.error(uploadResponse?.message || 'Error uploading file');
            setSending(false);
            return;
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error('Error uploading file');
          setSending(false);
          return;
        }
      }

      const response = await messageService.send(
        selectedThread.otherUserID,
        messageText.trim(),
        null,
        'General',
        attachmentUrl,
        replyingTo?.messageID || replyingTo?.MessageID || null
      );

      if (response && response.success) {
        setMessageText('');
        setSelectedFile(null);
        setReplyingTo(null);
        await fetchConversation(selectedThread.otherUserID);
        await fetchThreads();
        inputRef.current?.focus();
      } else {
        toast.error(response?.message || 'Error sending message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getUserImage = (imageUrl, firstName, lastName) => {
    if (imageUrl) {
      return imageUrl.startsWith('http')
        ? imageUrl
        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${imageUrl}`;
    }
    return null;
  };

  const getUserInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const filteredThreads = threads.filter(thread =>
    thread.otherUserName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50">
      {/* Threads Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => {
                setShowUserSelect(true);
                fetchAvailableUsers();
              }}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              title="New conversation"
            >
              <FaPlus />
            </button>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <FaUser className="text-4xl text-gray-300 mx-auto mb-2" />
              <p>No conversations found</p>
              <button
                onClick={() => {
                  setShowUserSelect(true);
                  fetchAvailableUsers();
                }}
                className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.otherUserID}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedThread?.otherUserID === thread.otherUserID
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {getUserImage(thread.otherUserImageUrl, thread.otherUserName.split(' ')[0], thread.otherUserName.split(' ')[1]) ? (
                        <img
                          src={getUserImage(thread.otherUserImageUrl, thread.otherUserName.split(' ')[0], thread.otherUserName.split(' ')[1])}
                          alt={thread.otherUserName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {getUserInitials(thread.otherUserName.split(' ')[0], thread.otherUserName.split(' ')[1] || '')}
                          </span>
                        </div>
                      )}
                      {thread.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {thread.otherUserName}
                        </p>
                        {thread.lastMessageDate && (
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTimeAgo(thread.lastMessageDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {thread.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Conversation Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                {getUserImage(conversation?.otherUserImageUrl, conversation?.otherUserName.split(' ')[0], conversation?.otherUserName.split(' ')[1]) ? (
                  <img
                    src={getUserImage(conversation?.otherUserImageUrl, conversation?.otherUserName.split(' ')[0], conversation?.otherUserName.split(' ')[1])}
                    alt={conversation?.otherUserName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-xs">
                      {getUserInitials(conversation?.otherUserName.split(' ')[0], conversation?.otherUserName.split(' ')[1] || '')}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{conversation?.otherUserName || selectedThread.otherUserName}</h3>
                  <p className="text-sm text-gray-500">{conversation?.otherUserRole || selectedThread.otherUserRole}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {conversation?.messages && conversation.messages.length > 0 ? (
                <div className="space-y-4">
                  {conversation.messages.map((message) => {
                    const isFromMe = (message.senderID || message.SenderID) === user.userID;
                    const hasReply = message.replyToMessageID || message.ReplyToMessageID;
                    return (
                      <div
                        key={message.messageID}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {getUserImage(
                              isFromMe ? user.profileImageUrl : (message.senderImageUrl || message.SenderImageUrl),
                              isFromMe ? user.firstName : (message.senderName || message.SenderName).split(' ')[0],
                              isFromMe ? user.lastName : (message.senderName || message.SenderName).split(' ')[1]
                            ) ? (
                              <img
                                src={getUserImage(
                                  isFromMe ? user.profileImageUrl : (message.senderImageUrl || message.SenderImageUrl),
                                  isFromMe ? user.firstName : (message.senderName || message.SenderName).split(' ')[0],
                                  isFromMe ? user.lastName : (message.senderName || message.SenderName).split(' ')[1]
                                )}
                                alt={isFromMe ? `${user.firstName} ${user.lastName}` : (message.senderName || message.SenderName)}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 font-semibold text-xs">
                                  {isFromMe
                                    ? getUserInitials(user.firstName, user.lastName)
                                    : getUserInitials((message.senderName || message.SenderName).split(' ')[0], (message.senderName || message.SenderName).split(' ')[1] || '')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}>
                            {hasReply && (
                              <div className={`text-xs text-gray-500 mb-1 px-2 ${isFromMe ? 'text-right' : 'text-left'}`}>
                                Replying to: {(message.replyToMessageText || message.ReplyToMessageText || '').substring(0, 50)}...
                              </div>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isFromMe
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              {(message.attachmentUrl || message.AttachmentUrl) && (
                                <div className="mb-2">
                                  <a
                                    href={(message.attachmentUrl || message.AttachmentUrl).startsWith('http')
                                      ? (message.attachmentUrl || message.AttachmentUrl)
                                      : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${message.attachmentUrl || message.AttachmentUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm underline"
                                  >
                                    <FaPaperclip />
                                    {message.attachmentFileName || message.AttachmentFileName || 'Attachment'}
                                  </a>
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.messageText || message.MessageText}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(message.sentDate || message.SentDate)}
                              </span>
                              {!isFromMe && (
                                <button
                                  onClick={() => handleReply(message)}
                                  className="text-xs text-gray-500 hover:text-primary-600"
                                  title="Reply"
                                >
                                  <FaReply />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaReply className="text-primary-600" />
                  <span>Replying to: {replyingTo.messageText.substring(0, 50)}{replyingTo.messageText.length > 50 ? '...' : ''}</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              {selectedFile && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FaImage className="text-primary-600" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{selectedFile.name}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-primary-600"
                      title="Attach file"
                    >
                      <FaPaperclip />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 hover:text-primary-600 relative"
                      title="Add emoji"
                    >
                      <FaSmile />
                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 h-48 overflow-y-auto z-10">
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.map((emoji, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-xl hover:bg-gray-100 rounded p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx"
                />
                <button
                  type="submit"
                  disabled={(!messageText.trim() && !selectedFile) || sending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaPaperPlane />
                  )}
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-lg">Select a conversation to start messaging</p>
              <button
                onClick={() => {
                  setShowUserSelect(true);
                  fetchAvailableUsers();
                }}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Selection Modal */}
      <Modal
        isOpen={showUserSelect}
        onClose={() => setShowUserSelect(false)}
        title="Select User to Message"
        size="lg"
      >
        <div className="space-y-4">
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users available</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {availableUsers.map((availableUser) => (
                <button
                  key={availableUser.userID}
                  onClick={() => handleStartConversation(availableUser)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  {getUserImage(availableUser.profileImageUrl, availableUser.firstName, availableUser.lastName) ? (
                    <img
                      src={getUserImage(availableUser.profileImageUrl, availableUser.firstName, availableUser.lastName)}
                      alt={availableUser.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {getUserInitials(availableUser.firstName, availableUser.lastName)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{availableUser.fullName}</p>
                    <p className="text-sm text-gray-500">{availableUser.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MessageCenter;
