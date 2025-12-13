import React from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { FaEdit, FaPhone, FaEnvelope, FaMapMarkerAlt, FaUser, FaCalendarAlt, FaHeartbeat } from 'react-icons/fa';

const PatientDetails = ({ patient, onEdit }) => {
  if (!patient) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {patient.firstName} {patient.lastName}
          </h2>
          <p className="text-gray-600 mt-1">Patient ID: {patient.patientID}</p>
        </div>
        <div className="flex gap-2">
          {patient.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="danger">Inactive</Badge>
          )}
          <Button variant="outline" size="sm" onClick={onEdit} icon={<FaEdit />}>
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card title="Personal Information">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FaUser className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">
                  {patient.firstName} {patient.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  {formatDate(patient.dateOfBirth)} ({patient.age} years old)
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium text-gray-900">{patient.gender}</p>
            </div>
            {patient.bloodType && (
              <div className="flex items-start gap-3">
                <FaHeartbeat className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Blood Type</p>
                  <p className="font-medium text-gray-900">{patient.bloodType}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Contact Information */}
        <Card title="Contact Information">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FaPhone className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">{patient.phoneNumber}</p>
              </div>
            </div>
            {patient.email && (
              <div className="flex items-start gap-3">
                <FaEnvelope className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{patient.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {patient.address}, {patient.sector}
                </p>
                <p className="text-sm text-gray-600">{patient.district}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Emergency Contact</p>
              <p className="font-medium text-gray-900">{patient.emergencyContactName}</p>
              <p className="text-sm text-gray-600">{patient.emergencyContact}</p>
            </div>
          </div>
        </Card>

        {/* Medical Information */}
        {(patient.medicalHistory || patient.allergies) && (
          <Card title="Medical Information" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {patient.allergies && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
                  <p className="text-gray-900 whitespace-pre-line">{patient.allergies}</p>
                </div>
              )}
              {patient.medicalHistory && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Medical History</p>
                  <p className="text-gray-900 whitespace-pre-line">{patient.medicalHistory}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Account Information */}
        <Card title="Account Information" className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created Date</p>
              <p className="font-medium text-gray-900">
                {formatDateTime(patient.createdDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium text-gray-900">
                {patient.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PatientDetails;
