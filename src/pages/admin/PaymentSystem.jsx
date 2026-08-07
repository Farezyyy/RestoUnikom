import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, QrCode, Receipt, CheckCircle, Users } from 'lucide-react';
import api from '../../api';
import { supabase } from '../../supabaseClient';

export default function PaymentSystem() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // CARD, CASH, QRIS
  const [cashReceived, setCashReceived] = useState('');
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
        .filter(t => t.status === 'LUNAS')
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

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'CASH' ? Math.max(0, cashReceivedNum - grandTotal) : 0;
  const cashValid = paymentMethod !== 'CASH' || cashReceivedNum >= grandTotal;

  const handlePayment = async () => {
    if (paymentMethod === 'CASH' && !cashValid) {
      alert('Jumlah uang diterima tidak cukup!');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create transaction
      const { data: trx } = await api.post('/transaksi', {
        id_order: selectedOrder,
        metode_pembayaran: paymentMethod,
        created_by: 1 // hardcoded admin for now
      });

      // 2. Process payment (mark LUNAS)
      await api.patch(`/transaksi/${trx.id}/pay`, {
        metode_pembayaran: paymentMethod
      });

      // 3. Auto-close the order & reservation (non-fatal: payment already succeeded)
      const order = activeOrders.find(o => o.id === selectedOrder);
      try {
        await api.patch(`/orders/${selectedOrder}/status`, { status: 'SELESAI' });
        if (order?.id_reservasi) {
          await api.patch(`/reservasi/${order.id_reservasi}/status`, { status: 'SELESAI' });
        }
      } catch (statusErr) {
        console.warn('Payment succeeded but status update failed', statusErr);
      }

      setIsPaid(true);
    } catch (err) {
      console.error("Payment failed", err);
      alert(err.response?.data?.message || 'Payment failed. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setSelectedOrder(null);
    setIsPaid(false);
    setCashReceived('');
    setPaymentMethod('CARD');
    fetchOrders(); // Refresh lists
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Active Tables List */}
      <div className="w-full lg:w-72 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-serif text-gray-800 dark:text-gray-100">Active Tables</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select to process bill</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
             <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Loading tables...</p>
          ) : activeOrders.length === 0 ? (
             <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No unpaid orders found.</p>
          ) : activeOrders.map(o => (
            <div 
              key={o.id}
              onClick={() => {
                setSelectedOrder(o.id);
                setIsPaid(false);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedOrder === o.id
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-800 dark:text-gray-100">
                  Table {o.reservasi?.reservasi_meja?.[0]?.meja?.no_meja || 'N/A'}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full flex items-center">
                  <Users className="w-3 h-3 mr-1" /> {o.order_course?.reduce((sum, c) => sum + c.qty, 0) || 0} Items
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{o.reservasi?.customer?.nama || 'Walk-in'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Column: Bill/Receipt Details */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-serif text-gray-800 dark:text-gray-100">Receipt Details</h2>
        </div>

        {tableData ? (
          <div className="flex-1 overflow-auto p-8 bg-gray-50/30 dark:bg-gray-950/30">
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 p-8 rounded-lg max-w-md mx-auto relative shadow-sm">
              <div className="text-center mb-6 border-b border-dashed border-gray-300 dark:border-gray-700 pb-4">
                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 tracking-widest uppercase">Resto Unikom</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Table {tableData.tableNo} • {tableData.customer}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{new Date().toLocaleString()}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Order #{tableData.id}</p>
              </div>

              <div className="space-y-4 mb-6">
                {tableData.orders.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{item.name}</span>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{item.qty} x Rp {item.price.toLocaleString()}</div>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Rp {(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
                {tableData.orders.length === 0 && (
                   <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic">No items in this order yet.</p>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>PB1 Tax (11%)</span>
                  <span>Rp {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Service Charge (5%)</span>
                  <span>Rp {serviceCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <span>Total</span>
                  <span>Rp {grandTotal.toLocaleString()}</span>
                </div>
              </div>
              
              {isPaid && (
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PAID</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">{paymentMethod} Payment Successful</p>
                  {paymentMethod === 'CASH' && cashReceivedNum > 0 && (
                    <div className="mt-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg px-6 py-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Kembalian</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">Rp {change.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30 dark:bg-gray-950/30">
            <Receipt className="w-16 h-16 opacity-30 mb-4" />
            <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">No Table Selected</h3>
            <p className="text-sm mt-2 max-w-sm">Select an active table from the left menu to view and process their bill.</p>
          </div>
        )}
      </div>

      {/* Right Column: Payment Processor */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Process Payment</h3>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <div className={`transition-opacity ${!tableData || isPaid ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Payment Method</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
              >
                <CreditCard className={`w-6 h-6 ${paymentMethod === 'CARD' ? 'text-primary dark:text-accent' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${paymentMethod === 'CARD' ? 'text-primary dark:text-accent' : 'text-gray-700 dark:text-gray-300'}`}>Credit / Debit Card</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">EDC Machine</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'QRIS' ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
              >
                <QrCode className={`w-6 h-6 ${paymentMethod === 'QRIS' ? 'text-primary dark:text-accent' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${paymentMethod === 'QRIS' ? 'text-primary dark:text-accent' : 'text-gray-700 dark:text-gray-300'}`}>QRIS / E-Wallet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Scan QR Code</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'CASH' ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
              >
                <Banknote className={`w-6 h-6 ${paymentMethod === 'CASH' ? 'text-primary dark:text-accent' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${paymentMethod === 'CASH' ? 'text-primary dark:text-accent' : 'text-gray-700 dark:text-gray-300'}`}>Cash</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Physical Currency</p>
                </div>
              </button>
            </div>

            {/* Cash Payment Input */}
            {paymentMethod === 'CASH' && tableData && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah Uang Diterima</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-lg font-bold focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Tagihan:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">Rp {grandTotal.toLocaleString()}</span>
                  </div>
                  {cashReceivedNum > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Uang Diterima:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">Rp {cashReceivedNum.toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700 ${cashValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span>Kembalian:</span>
                        <span>Rp {change.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  {!cashValid && cashReceivedNum > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 pt-1">⚠ Uang tidak cukup!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          {!isPaid ? (
            <button
              onClick={handlePayment}
              disabled={!tableData || isProcessing || tableData.orders.length === 0 || !cashValid}
              className="w-full py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-primary/20"
            >
              {isProcessing ? 'Processing...' : paymentMethod === 'CASH' && cashReceivedNum > 0 ? `Charge Rp ${grandTotal.toLocaleString()} (Change: Rp ${change.toLocaleString()})` : `Charge Rp ${grandTotal.toLocaleString()}`}
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
