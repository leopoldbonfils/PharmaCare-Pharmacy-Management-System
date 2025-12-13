import React from 'react';
import Card from '../common/Card';
import { FaClock } from 'react-icons/fa';

const RecentActivity = () => {
  return (
    <Card title="Recent Activity">
      <div className="space-y-3">
        <div className="text-center py-8 text-gray-500">
          <FaClock className="mx-auto text-gray-400 text-4xl mb-3" />
          <p>No recent activity</p>
        </div>
      </div>
    </Card>
  );
};

export default RecentActivity;

