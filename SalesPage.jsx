import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { saleService } from '../services/saleService';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaEye, FaPrint, FaDownload } from 'react-icons/fa';
import { formatDate, formatDateTime } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { PAYMENT_METHODS } from '../utils/constants';

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await saleService.getAll();
      if (response.success) {
        setSales(response.data || []);
      }
    } catch (error) {
      toast.error('Error loading sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale =>
    sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.patientName && sale.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }).reduce((sum, sale) => sum + sale.totalAmount, 0);

  const handleDownloadReceipt = (sale) => {
    const receiptHTML = generateReceiptHTML(sale);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const generateReceiptHTML = (sale) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #10b981; margin: 0; }
          .header p { color: #6b7280; margin: 5px 0; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { }
          .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { font-size: 16px; font-weight: 600; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .total-row { font-weight: 600; font-size: 18px; }
          .total-amount { color: #10b981; font-size: 24px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PharmaCare</h1>
          <p>Pharmacy Management System</p>
          <p>Invoice: ${sale.invoiceNumber}</p>
        </div>
        <div class="info">
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${formatDateTime(sale.saleDate)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Patient</div>
            <div class="info-value">${sale.patientName || 'Walk-in Customer'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${sale.paymentMethod}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Sold By</div>
            <div class="info-value">${sale.soldByName}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items?.map(item => `
              <tr>
                <td>
                  <strong>${item.medicineName}</strong><br>
                  <small style="color: #6b7280;">${item.genericName} - ${item.dosage}</small>
                </td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.totalPrice)}</td>
              </tr>
            `).join('') || ''}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 20px;">Total Amount:</td>
              <td class="total-amount">${formatCurrency(sale.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaShoppingCart className="text-primary-600" />
              Sales History
            </h1>
            <p className="text-gray-600 mt-1">View and manage sales transactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{sales.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Sales</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(todaySales)}</p>
              <p className="text-sm text-gray-600 mt-1">Today's Sales</p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-6">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by invoice number or patient name..." />
          </div>

          {loading ? <Loader /> : filteredSales.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-500">No sales found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={sale.saleID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{sale.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sale.patientName || 'Walk-in'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(sale.saleDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sale.items?.length || 0} items</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(sale.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sale.paymentMethod}</td>
                      <td className="px-6 py-4">
                        <Badge variant={sale.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                          {sale.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={async () => {
                            const response = await saleService.getById(sale.saleID);
                            if (response.success) {
                              setSelectedSale(response.data);
                              setShowDetailsModal(true);
                            }
                          }} icon={<FaEye />} className="!p-2" />
                          <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(sale)} icon={<FaDownload />} className="!p-2" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Modal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedSale(null); }} title="Sale Details" size="lg">
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Invoice Number</p><p className="font-medium">#{selectedSale.invoiceNumber}</p></div>
                <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formatDateTime(selectedSale.saleDate)}</p></div>
                <div><p className="text-sm text-gray-500">Patient</p><p className="font-medium">{selectedSale.patientName || 'Walk-in'}</p></div>
                <div><p className="text-sm text-gray-500">Payment Method</p><p className="font-medium">{selectedSale.paymentMethod}</p></div>
                <div><p className="text-sm text-gray-500">Payment Status</p><Badge variant={selectedSale.paymentStatus === 'Paid' ? 'success' : 'warning'}>{selectedSale.paymentStatus}</Badge></div>
                <div><p className="text-sm text-gray-500">Sold By</p><p className="font-medium">{selectedSale.soldByName}</p></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Items</p>
                <div className="space-y-2">
                  {selectedSale.items?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between">
                      <div>
                        <p className="font-medium">{item.medicineName}</p>
                        <p className="text-sm text-gray-600">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">{formatCurrency(selectedSale.totalAmount)}</span>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => handleDownloadReceipt(selectedSale)} icon={<FaDownload />}>
                  Download Receipt
                </Button>
                <Button variant="outline" onClick={() => {
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(generateReceiptHTML(selectedSale));
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => printWindow.print(), 250);
                }} icon={<FaPrint />}>
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default SalesPage;
