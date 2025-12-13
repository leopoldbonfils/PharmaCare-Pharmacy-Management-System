import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

const PrescriptionAlerts = ({ alerts, onDismiss }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'Error':
        return <FaTimesCircle className="text-red-600" />;
      case 'Warning':
        return <FaExclamationTriangle className="text-yellow-600" />;
      case 'Info':
        return <FaInfoCircle className="text-blue-600" />;
      default:
        return <FaInfoCircle className="text-gray-600" />;
    }
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case 'Error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'Warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'Info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${getAlertStyles(alert.severity)} flex items-start gap-3`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getAlertIcon(alert.severity)}
          </div>
          <div className="flex-1">
            <p className="font-medium mb-1">{alert.type}</p>
            <p className="text-sm">{alert.message}</p>
            {alert.prescriptionId && (
              <p className="text-xs mt-1 opacity-75">
                Related to Prescription #{alert.prescriptionId}
              </p>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(index)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <FaTimesCircle />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default PrescriptionAlerts;

