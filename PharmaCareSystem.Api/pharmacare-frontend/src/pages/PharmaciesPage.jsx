import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { pharmacyService } from '../services/pharmacyService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FaStore, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaCheckCircle, FaSearch } from 'react-icons/fa';

const PharmaciesPage = () => {
  const { user } = useAuth();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());

  useEffect(() => {
    fetchPharmacies();
    const saved = localStorage.getItem('selectedPharmacy');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedPharmacyId(parsed.pharmacistID);
    }
  }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getAll();
      if (response.success) {
        setPharmacies(response.data || []);
      } else {
        toast.error(response.message || 'Error loading pharmacies');
        setPharmacies([]);
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      toast.error('Error loading pharmacies');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPharmacy = (pharmacy) => {
    localStorage.setItem('selectedPharmacy', JSON.stringify(pharmacy));
    setSelectedPharmacyId(pharmacy.pharmacistID);
    toast.success(`Selected ${pharmacy.pharmacyName}`);
  };

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.pharmacyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.pharmacistName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaStore className="text-green-600" />
              Pharmacies
            </h2>
            <p className="text-gray-600 mt-2">Select a pharmacy to process your medication requests</p>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by pharmacy name, location, or pharmacist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </Card>

        {/* Currently Selected Pharmacy */}
        {selectedPharmacyId && pharmacies.find(p => p.pharmacistID === selectedPharmacyId) && (
          <Card className="bg-green-50 border-2 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const selectedPharmacy = pharmacies.find(p => p.pharmacistID === selectedPharmacyId);
                  const imageUrl = selectedPharmacy?.imageUrl;
                  return imageUrl ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-green-600 bg-green-100 flex items-center justify-center">
                      <img
                        src={
                          imageUrl.startsWith('http')
                            ? imageUrl
                            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${imageUrl}`
                        }
                        alt={selectedPharmacy.pharmacyName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <FaCheckCircle className="text-white text-2xl" />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-medium text-green-800">Currently Selected</p>
                  <p className="text-lg font-bold text-green-900">
                    {pharmacies.find(p => p.pharmacistID === selectedPharmacyId)?.pharmacyName}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader />
            <p className="mt-4 text-gray-600">Loading pharmacies...</p>
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <FaStore className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No pharmacies found' : 'No pharmacies available'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchQuery ? 'Try adjusting your search criteria' : 'Please check back later'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharmacy) => (
              <Card 
                key={pharmacy.pharmacistID} 
                className={`hover:shadow-xl transition-shadow ${
                  selectedPharmacyId === pharmacy.pharmacistID ? 'border-2 border-green-500' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Pharmacy Header */}
                  <div className="flex items-start gap-3">
                    {/* Pharmacy/Pharmacist Image */}
                    {pharmacy.imageUrl && !imageErrors.has(pharmacy.pharmacistID) ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-green-200 bg-green-100 flex items-center justify-center">
                        <img
                          src={
                            pharmacy.imageUrl.startsWith('http')
                              ? pharmacy.imageUrl
                              : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050'}${pharmacy.imageUrl}`
                          }
                          alt={pharmacy.pharmacyName}
                          className="w-full h-full object-cover"
                          onError={() => {
                            // Track image load errors
                            setImageErrors(prev => new Set(prev).add(pharmacy.pharmacistID));
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-green-200">
                        <FaStore className="text-green-600 text-2xl" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900">{pharmacy.pharmacyName}</h3>
                      <p className="text-sm text-gray-600">Pharmacist: {pharmacy.pharmacistName}</p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-gray-700">
                      <FaMapMarkerAlt className="text-green-600 mt-1 flex-shrink-0" />
                      <span>{pharmacy.location || 'Kigali, Rwanda'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaPhone className="text-green-600 flex-shrink-0" />
                      <span>{pharmacy.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaEnvelope className="text-green-600 flex-shrink-0" />
                      <span className="truncate">{pharmacy.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaClock className="text-green-600 flex-shrink-0" />
                      <span>{pharmacy.openHours || 'Mon-Sat: 8:00 AM - 6:00 PM'}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className={`w-full ${
                      selectedPharmacyId === pharmacy.pharmacistID
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    onClick={() => handleSelectPharmacy(pharmacy)}
                  >
                    {selectedPharmacyId === pharmacy.pharmacistID ? (
                      <>
                        <FaCheckCircle className="inline mr-2" />
                        Selected
                      </>
                    ) : (
                      'Choose This Pharmacy'
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Footer */}
        {filteredPharmacies.length > 0 && (
          <Card className="bg-gray-50">
            <div className="text-center py-6">
              <p className="text-gray-600">
                Need help choosing? Contact any pharmacy directly or check their operating hours.
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PharmaciesPage;