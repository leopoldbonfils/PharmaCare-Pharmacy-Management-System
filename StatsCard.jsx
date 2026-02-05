import React from 'react';
import Card from '../common/Card';

const StatsCard = ({ title, value, icon, bgColor, textColor, onClick, clickable }) => {
  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold ${textColor || 'text-gray-900'} mt-2`}>
          {value}
        </p>
      </div>
      <div className={`w-16 h-16 ${bgColor || 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );

  if (clickable && onClick) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
        {content}
      </Card>
    );
  }

  return <Card>{content}</Card>;
};

export default StatsCard;

