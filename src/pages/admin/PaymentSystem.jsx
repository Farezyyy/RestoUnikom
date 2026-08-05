import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, QrCode, Receipt, CheckCircle, Users } from 'lucide-react';
import api from '../../api';
import { supabase } from '../../supabaseClient';

export default function PaymentSystem() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // CARD, CASH, QRIS
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      // Fetch all orders
      const { data: orders } = await api.get('/orders');
      // Fetch all transactions to filter out paid ones
      const { data: transaksis } = await api.get('/transaksi');
      
      const paidOrderIds = (transaksis || [])
        .filter(t => t.status === 'LUNAS' || t.status === 'PAID')
        .map(t => t.id_order);
        
      // Filter orders that are not paid yet
      const unpaidOrders = (orders || []).filter(o => !paidOrderIds.includes(o.id));
      
      setActiveOrders(unpaidOrders);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('payment_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi' }, fetchOrders)
      .subscribe();

    const interval = setInterval(fetchOrders, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Prepare table data for the selected order
  let tableData = null;
  if (selectedOrder) {
    const order = activeOrders.find(o => o.id === selectedOrder);
    if (order) {
      // Map courses to an items array
      const items = order.order_course.map(oc => ({
        name: oc.menu?.nama || `Menu #${oc.menu_id}`,
        qty: oc.qty,
        price: oc.menu?.harga || 0
      }));
      
      tableData = {
        id: order.id,
        tableNo: order.reservasi?.reservasi_meja?.[0]?.meja?.no_meja || 'N/A',
        customer: order.reservasi?.customer?.nama || 'Walk-in',
        orders: items
      };
    }
  }

  const subtotal = tableData ? tableData.orders.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;
  const tax = subtotal * 0.11; // 11% PB1 tax
  const serviceCharge = subtotal * 0.05; // 5% service
  const grandTotal = subtotal + tax + serviceCharge;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create transaction
      const { data: trx } = await api.post('/transaksi', {
        id_order: selectedOrder,
        metode_pembayaran: paymentMethod,
        created_by: 1 // hardcoded admin for now
      });
      
      // 2. Process payment
      await api.patch(`/transaksi/${trx.id}/process`, {
        metode_pembayaran: paymentMethod
      });
      
      setIsPaid(true);
    } catch (err) {
      console.error("Payment failed", err);
      alert('Payment failed. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setSelectedOrder(null);
    setIsPaid(false);
    fetchOrders(); // Refresh lists
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Active Tables List */}
      <div className="w-full lg:w-72 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-serif text-gray-800">Active Tables</h2>
          <p className="text-sm text-gray-500 mt-1">Select to process bill</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
             <p className="text-sm text-gray-500 text-center py-4">Loading tables...</p>
          ) : activeOrders.length === 0 ? (
             <p className="text-sm text-gray-500 text-center py-4">No unpaid orders found.</p>
          ) : activeOrders.map(o => (
            <div 
              key={o.id}
              onClick={() => {
                setSelectedOrder(o.id);
                setIsPaid(false);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedOrder === o.id 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-800">
                  Table {o.reservasi?.reservasi_meja?.[0]?.meja?.no_meja || 'N/A'}
                </span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center">
                  <Users className="w-3 h-3 mr-1" /> {o.order_course?.reduce((sum, c) => sum + c.qty, 0) || 0} Items
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">{o.reservasi?.customer?.nama || 'Walk-in'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Column: Bill/Receipt Details */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-serif text-gray-800">Receipt Details</h2>
        </div>

        {tableData ? (
          <div className="flex-1 overflow-auto p-8 bg-gray-50/30">
            <div className="bg-white border border-dashed border-gray-300 p-8 rounded-lg max-w-md mx-auto relative shadow-sm">
              <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
                <h3 className="text-2xl font-serif font-bold text-gray-900 tracking-widest uppercase">Resto Unikom</h3>
                <p className="text-sm text-gray-500 mt-2">Table {tableData.tableNo} • {tableData.customer}</p>
                <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Order #{tableData.id}</p>
              </div>

              <div className="space-y-4 mb-6">
                {tableData.orders.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <div className="text-gray-500 text-xs">{item.qty} x Rp {item.price.toLocaleString()}</div>
                    </div>
                    <span className="font-medium text-gray-900">Rp {(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
                {tableData.orders.length === 0 && (
                   <p className="text-sm text-gray-500 text-center italic">No items in this order yet.</p>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>PB1 Tax (11%)</span>
                  <span>Rp {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service Charge (5%)</span>
                  <span>Rp {serviceCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>Rp {grandTotal.toLocaleString()}</span>
                </div>
              </div>
              
              {isPaid && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900">PAID</h3>
                  <p className="text-gray-600 font-medium">{paymentMethod} Payment Successful</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
            <Receipt className="w-16 h-16 opacity-30 mb-4" />
            <h3 className="text-xl font-medium text-gray-500">No Table Selected</h3>
            <p className="text-sm mt-2 max-w-sm">Select an active table from the left menu to view and process their bill.</p>
          </div>
        )}
      </div>

      {/* Right Column: Payment Processor */}
      <div className="w-full lg:w-80 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-medium text-gray-800">Process Payment</h3>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <div className={`transition-opacity ${!tableData || isPaid ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-primary/50'}`}
              >
                <CreditCard className={`w-6 h-6 ${paymentMethod === 'CARD' ? 'text-primary' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${paymentMethod === 'CARD' ? 'text-primary' : 'text-gray-700'}`}>Credit / Debit Card</p>
                  <p className="text-xs text-gray-500">EDC Machine</p>
                </div>
              </button>
              
              <button 
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'QRIS' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-primary/50'}`}
              >
                <QrCode className={`w-6 h-6 ${paymentMethod === 'QRIS' ? 'text-primary' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${paymentMethod === 'QRIS' ? 'text-primary' : 'text-gray-700'}`}>QRIS / E-Wallet</p>
                  <p className="text-xs text-gray-500">Scan QR Code</p>
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'CASH' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-primary/50'}`}
              >
                <Banknote className={`w-6 h-6 ${paymentMethod === 'CASH' ? 'text-primary' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${paymentMethod === 'CASH' ? 'text-primary' : 'text-gray-700'}`}>Cash</p>
                  <p className="text-xs text-gray-500">Physical Currency</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          {!isPaid ? (
            <button 
              onClick={handlePayment}
              disabled={!tableData || isProcessing || tableData.orders.length === 0}
              className="w-full py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-primary/20"
            >
              {isProcessing ? 'Processing...' : `Charge Rp ${grandTotal.toLocaleString()}`}
            </button>
          ) : (
            <button 
              onClick={handleNewTransaction}
              className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center shadow-md shadow-green-600/20"
            >
              Close Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
