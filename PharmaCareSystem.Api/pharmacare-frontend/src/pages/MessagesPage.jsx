import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import MessageCenter from '../components/messages/MessageCenter';
import { FaComments } from 'react-icons/fa';

const MessagesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 h-full">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaComments className="text-primary-600" />
            Messages
          </h2>
          <p className="text-gray-600 mt-2">Chat with patients and pharmacists</p>
        </div>
        <div className="flex-1">
          <MessageCenter />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;

