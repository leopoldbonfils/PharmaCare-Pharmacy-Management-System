import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

const Alert = ({ type = 'info', message, title = null, onClose = null }) => {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <FaCheckCircle className="text-green-500" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <FaTimesCircle className="text-red-500" />
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <FaExclamationTriangle className="text-yellow-500" />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <FaInfoCircle className="text-blue-500" />
    }
  };

  const config = types[type];

  return (
    <div className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
      <div className="flex">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-medium ${config.text}`}>{title}</h3>}
          <p className={`text-sm ${config.text} ${title ? 'mt-1' : ''}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${config.text} hover:opacity-75`}
          >
            <FaTimesCircle />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;