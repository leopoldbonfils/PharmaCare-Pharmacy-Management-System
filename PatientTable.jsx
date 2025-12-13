import React from 'react';
import { FaEdit, FaEye, FaTrash, FaPhone, FaEnvelope } from 'react-icons/fa';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loader from '../common/Loader';
import { formatDate } from '../../utils/formatDate';

const PatientTable = ({ patients, onEdit, onView, onDelete, loading }) => {
  if (loading) {
    return <Loader text="Loading patients..." />;
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No patients found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date of Birth
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gender
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {patients.map((patient) => (
            <tr key={patient.patientID} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </div>
                  <div className="text-sm text-gray-500">ID: {patient.patientID}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 flex items-center gap-2">
                  <FaPhone className="text-gray-400" />
                  {patient.phoneNumber}
                </div>
                {patient.email && (
                  <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <FaEnvelope className="text-gray-400" />
                    {patient.email}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(patient.dateOfBirth)}</div>
                <div className="text-sm text-gray-500">Age: {patient.age} years</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{patient.gender}</span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{patient.district}</div>
                <div className="text-sm text-gray-500">{patient.sector}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {patient.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="danger">Inactive</Badge>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(patient)}
                    icon={<FaEye />}
                    className="!p-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(patient)}
                    icon={<FaEdit />}
                    className="!p-2"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(patient)}
                    icon={<FaTrash />}
                    className="!p-2"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientTable;
