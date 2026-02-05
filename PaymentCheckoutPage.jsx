import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { prescriptionService } from '../services/prescriptionService';
import { medicationRequestService } from '../services/medicationRequestService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCreditCard, FaMobileAlt } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

const PaymentCheckoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prescriptionId } = useParams();
  const [searchParams] = useSearchParams();
  const medicationRequestId = searchParams.get('medicationRequestId');
  const [prescription, setPrescription] = useState(null);
  const [medicationRequest, setMedicationRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('MTN_MoMo');
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription();
    } else if (medicationRequestId) {
      fetchMedicationRequest();
    }
  }, [prescriptionId, medicationRequestId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await prescriptionService.getById(parseInt(prescriptionId));
      if (response.success) {
        setPrescription(response.data);
      } else {
        toast.error('Prescription not found');
        navigate('/payments');
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
      toast.error('Error loading prescription');
      navigate('/payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicationRequest = async () => {
    try {
      setLoading(true);
      const response = await medicationRequestService.getById(parseInt(medicationRequestId));
      if (response.success) {
        setMedicationRequest(response.data);
      } else {
        toast.error('Medication request not found');
        navigate('/medication-requests');
      }
    } catch (error) {
      console.error('Error fetching medication request:', error);
      toast.error('Error loading medication request');
      navigate('/medication-requests');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (prescription?.items) {
      return prescription.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    if (medicationRequest?.requestItems) {
      return medicationRequest.requestItems.reduce((sum, item) => sum + (item.requestedQuantity * item.unitPrice), 0);
    }
    return 0;
  };

  const handlePayment = async () => {
    // For Cash, transaction ref is optional. For others, require it.
    if (selectedMethod !== 'Cash' && selectedMethod !== 'Credit_Card' && !transactionRef.trim()) {
      toast.error('Please enter transaction reference');
      return;
    }

    setProcessing(true);
    try {
      // Always provide transaction ref - backend will auto-complete if Cash or has ref
      const paymentData = {
        method: selectedMethod,
        transactionRef: transactionRef || (selectedMethod === 'Cash' ? `CASH-${Date.now()}` : selectedMethod === 'Credit_Card' ? `CARD-${Date.now()}` : `TXN-${Date.now()}`),
        paymentDetails: `Payment via ${selectedMethod}`
      };

      if (prescriptionId) {
        paymentData.prescriptionID = parseInt(prescriptionId);
      } else if (medicationRequestId) {
        paymentData.medicationRequestID = parseInt(medicationRequestId);
      }

      console.log('Creating payment with data:', paymentData);
      const response = await paymentService.create(paymentData);
      console.log('Payment response:', response);

      if (response.success) {
        // Backend now creates payments as Completed if Cash or has transaction ref
        if (response.data?.status === 'Completed') {
          toast.success('Payment completed successfully!');
        } else {
          toast.success('Payment created successfully!');
        }
        
        // Small delay to ensure backend has processed everything
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Always navigate to payments page to see payment history
        navigate('/payments', { replace: true });
      } else {
        toast.error(response.message || 'Error processing payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error processing payment';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    );
  }

  if (!prescription && !medicationRequest) {
    return null;
  }

  const total = calculateTotal();
  const isMedicationRequest = !!medicationRequest;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Payment Checkout</h2>
          <p className="text-gray-600 mt-2">
            {isMedicationRequest 
              ? `Complete payment for Medication Request #${medicationRequest.medicationRequestID}`
              : `Complete payment for Prescription #${prescription.prescriptionID}`
            }
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            {isMedicationRequest ? (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Medication Request Details</h3>
                  <p className="text-sm text-gray-600">Symptoms: {medicationRequest.symptoms}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(medicationRequest.requestDate).toLocaleDateString()}</p>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Medicines</h3>
                  <div className="space-y-2">
                    {medicationRequest.requestItems?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.medicineName} x{item.requestedQuantity}</span>
                        <span>{formatCurrency(item.requestedQuantity * item.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Prescription Details</h3>
                  <p className="text-sm text-gray-600">Diagnosis: {prescription.diagnosis}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(prescription.prescriptionDate).toLocaleDateString()}</p>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Medicines</h3>
                  <div className="space-y-2">
                    {prescription.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.medicineName} x{item.quantity}</span>
                        <span>{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Select Payment Method</h3>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="MTN_MoMo"
                checked={selectedMethod === 'MTN_MoMo'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-3"
              />
              <FaMobileAlt className="text-2xl text-yellow-600 mr-3" />
              <div>
                <p className="font-medium">MTN Mobile Money</p>
                <p className="text-sm text-gray-600">Pay using your MTN MoMo account</p>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="Airtel_Money"
                checked={selectedMethod === 'Airtel_Money'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-3"
              />
              <FaMobileAlt className="text-2xl text-red-600 mr-3" />
              <div>
                <p className="font-medium">Airtel Money</p>
                <p className="text-sm text-gray-600">Pay using your Airtel Money account</p>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="Credit_Card"
                checked={selectedMethod === 'Credit_Card'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-3"
              />
              <FaCreditCard className="text-2xl text-blue-600 mr-3" />
              <div>
                <p className="font-medium">Credit Card</p>
                <p className="text-sm text-gray-600">Pay using credit/debit card</p>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="Cash"
                checked={selectedMethod === 'Cash'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-3"
              />
              <FaCreditCard className="text-2xl text-green-600 mr-3" />
              <div>
                <p className="font-medium">Cash</p>
                <p className="text-sm text-gray-600">Pay with cash at pharmacy</p>
              </div>
            </label>
          </div>

          {(selectedMethod === 'MTN_MoMo' || selectedMethod === 'Airtel_Money') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter transaction reference from your payment"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the transaction reference number you received after making the payment
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => navigate(isMedicationRequest ? '/medication-requests' : '/payments')}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={processing}>
              {processing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PaymentCheckoutPage;

