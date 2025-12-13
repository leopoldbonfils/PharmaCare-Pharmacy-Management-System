import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import { medicineService } from '../services/medicineService';
import { patientService } from '../services/patientService';
import { saleService } from '../services/saleService';
import { medicationRequestService } from '../services/medicationRequestService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCheck, FaUser, FaClipboardList, FaBox } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';
import { PAYMENT_METHODS } from '../utils/constants';
import Badge from '../components/common/Badge';
import { formatDate } from '../utils/formatDate';

const POSPage = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [loading, setLoading] = useState(false);
  const [awaitingDispense, setAwaitingDispense] = useState([]);
  const [showAwaitingDispense, setShowAwaitingDispense] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'

  useEffect(() => {
    fetchMedicines();
    fetchPatients();
    fetchAwaitingDispense();
  }, []);

  const fetchAwaitingDispense = async () => {
    try {
      const response = await medicationRequestService.getAwaitingDispense(user?.userID);
      if (response.success) {
        setAwaitingDispense(response.data || []);
      }
    } catch (error) {
      console.error('Error loading awaiting dispense:', error);
    }
  };

  const handleCompleteSaleFromRequest = async (requestId) => {
    if (!window.confirm('Complete sale and dispense this medication request?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await saleService.completeFromMedicationRequest(requestId);
      if (response.success) {
        toast.success('Sale completed and medication dispensed successfully!');
        fetchAwaitingDispense();
        fetchMedicines(); // Refresh stock
      } else {
        toast.error(response.message || 'Error completing sale');
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error(error.response?.data?.message || 'Error completing sale');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await medicineService.getAll();
      if (response.success) {
        setMedicines(response.data?.filter(m => m.isActive && m.stockQuantity > 0) || []);
      }
    } catch (error) {
      toast.error('Error loading medicines');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      if (response.success) {
        setPatients(response.data || []);
      }
    } catch (error) {
      console.error('Error loading patients');
    }
  };

  const filteredMedicines = medicines.filter(m =>
    m.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine) => {
    const existingItem = cart.find(item => item.medicineID === medicine.medicineID);
    if (existingItem) {
      if (existingItem.quantity >= medicine.stockQuantity) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.medicineID === medicine.medicineID
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (medicine.stockQuantity < 1) {
        toast.error('Out of stock');
        return;
      }
      setCart([...cart, {
        medicineID: medicine.medicineID,
        medicineName: medicine.medicineName,
        genericName: medicine.genericName,
        unitPrice: medicine.price,
        quantity: 1,
        stockQuantity: medicine.stockQuantity
      }]);
    }
    toast.success('Added to cart');
  };

  const updateQuantity = (medicineID, change) => {
    setCart(cart.map(item => {
      if (item.medicineID === medicineID) {
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) return item;
        if (newQuantity > item.stockQuantity) {
          toast.error('Insufficient stock');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (medicineID) => {
    setCart(cart.filter(item => item.medicineID !== medicineID));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedPatient(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const total = subtotal;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      const response = await saleService.create({
        patientID: selectedPatient?.patientID || null,
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          medicineID: item.medicineID,
          quantity: item.quantity
        }))
      });

      if (response.success) {
        toast.success('Sale completed successfully');
        clearCart();
        setShowPaymentModal(false);
        fetchMedicines();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'products'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaShoppingCart className="inline mr-2" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'orders'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            Orders Awaiting Dispense
            {awaitingDispense.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {awaitingDispense.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Products or Orders */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'products' ? (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Products</h2>
                  {selectedPatient && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaUser />
                      <span>{selectedPatient.firstName} {selectedPatient.lastName}</span>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search medicines..."
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredMedicines.map((medicine) => (
                    <button
                      key={medicine.medicineID}
                      onClick={() => addToCart(medicine)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
                      disabled={medicine.stockQuantity === 0}
                    >
                      <div className="font-medium text-gray-900">{medicine.medicineName}</div>
                      <div className="text-sm text-gray-600">{medicine.genericName}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-primary-600">{formatCurrency(medicine.price)}</span>
                        <span className={`text-xs ${medicine.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Stock: {medicine.stockQuantity}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Orders Awaiting Dispense</h2>
                  <Badge variant="success">{awaitingDispense.length} orders</Badge>
                </div>
                {awaitingDispense.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaBox className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No orders awaiting dispense</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Paid medication requests will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {awaitingDispense.map((request) => (
                      <div
                        key={request.medicationRequestID}
                        className="p-4 border border-green-200 bg-green-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                Request #{request.medicationRequestID}
                              </h3>
                              <Badge variant="success">Paid</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Patient:</strong> {request.patientName}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Date:</strong> {formatDate(request.requestDate)}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Total:</strong> {formatCurrency(request.totalAmount)}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {request.symptoms.substring(0, 100)}{request.symptoms.length > 100 ? '...' : ''}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleCompleteSaleFromRequest(request.medicationRequestID)}
                            disabled={loading}
                            icon={<FaCheck />}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Complete Sale
                          </Button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Medicines:</p>
                          <div className="space-y-1">
                            {request.requestItems?.map((item, idx) => (
                              <div key={idx} className="text-xs text-gray-600">
                                • {item.medicineName} - Qty: {item.requestedQuantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.requestedQuantity * item.unitPrice)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Panel - Cart (only show in products tab) */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Cart</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPatientModal(true)}
                    icon={<FaUser />}
                  >
                    {selectedPatient ? 'Change' : 'Select'} Patient
                  </Button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaShoppingCart className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar mb-4">
                      {cart.map((item) => (
                        <div key={item.medicineID} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.medicineName}</p>
                              <p className="text-xs text-gray-600">{formatCurrency(item.unitPrice)}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.medicineID)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.medicineID, -1)}
                                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              >
                                <FaMinus className="text-xs" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.medicineID, 1)}
                                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              >
                                <FaPlus className="text-xs" />
                              </button>
                            </div>
                            <span className="font-bold text-primary-600">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total:</span>
                        <span className="text-primary-600">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={clearCart} className="flex-1">
                          Clear
                        </Button>
                        <Button onClick={handleCheckout} className="flex-1" icon={<FaCheck />}>
                          Checkout
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Patient Selection Modal */}
        <Modal isOpen={showPatientModal} onClose={() => setShowPatientModal(false)} title="Select Patient" size="md">
          <div className="space-y-4">
            <SearchBar
              placeholder="Search patients..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setShowPatientModal(false);
                  toast.success('Walk-in customer selected');
                }}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Walk-in Customer
              </button>
              {patients.map(patient => (
                <button
                  key={patient.patientID}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setShowPatientModal(false);
                    toast.success(`Patient selected: ${patient.firstName} ${patient.lastName}`);
                  }}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                  <div className="text-sm text-gray-600">{patient.phoneNumber}</div>
                </button>
              ))}
            </div>
          </div>
        </Modal>

        {/* Payment Modal */}
        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Complete Payment" size="sm">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-primary-600">{formatCurrency(total)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                {Object.values(PAYMENT_METHODS).map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={processPayment} disabled={loading} className="flex-1">
                {loading ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default POSPage;
