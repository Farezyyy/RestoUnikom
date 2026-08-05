import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowDownToLine, Receipt } from 'lucide-react';
import api from '../../api';

export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transaksi');
      
      // Map data for display
      const mapped = data.map(t => {
        const dateObj = new Date(t.created_at);
        const order = t.order || {};
        const reservasi = order.reservasi || {};
        
        return {
          id: `TRX-${t.id}`,
          rawId: t.id,
          date: dateObj.toLocaleDateString(),
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          table: reservasi.reservasi_meja?.[0]?.meja?.no_meja || 'N/A',
          customer: reservasi.customer?.nama || 'Walk-in',
          items: order.order_course?.reduce((sum, c) => sum + (c.qty || 1), 0) || 0,
          total: Number(t.total) || 0,
          method: t.metode_pembayaran || 'CASH',
          status: t.status
        };
      });
      
      setTransactions(mapped);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodBadge = (method) => {
    switch(method) {
      case 'CARD': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">CARD</span>;
      case 'QRIS': return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">QRIS</span>;
      case 'CASH': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">CASH</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded">{method}</span>;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'LUNAS' || status === 'PAID') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">PAID</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">{status}</span>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif text-gray-800">Transaction History</h2>
          <p className="text-sm text-gray-500 mt-1">Review past revenue and completed orders</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center bg-gray-50" title="Export CSV">
            <ArrowDownToLine className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Customer Info</th>
              <th className="p-4">Payment Method</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Revenue (Rp)</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">Loading transactions...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500 italic">No transactions found matching your search.</td>
              </tr>
            ) : filtered.map(trx => (
              <tr key={trx.rawId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-900">{trx.id}</td>
                <td className="p-4">
                  <p className="font-medium text-gray-800">{trx.date}</p>
                  <p className="text-sm text-gray-500">{trx.time}</p>
                </td>
                <td className="p-4">
                  <p className="font-medium text-gray-800">{trx.customer}</p>
                  <p className="text-sm text-gray-500">Table {trx.table} • {trx.items} Items</p>
                </td>
                <td className="p-4">{getMethodBadge(trx.method)}</td>
                <td className="p-4">{getStatusBadge(trx.status)}</td>
                <td className="p-4 text-right">
                  <span className="font-bold text-gray-900 text-lg">Rp {trx.total.toLocaleString()}</span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-primary hover:text-secondary p-2 transition-colors inline-flex items-center text-sm font-medium">
                    <Receipt className="w-4 h-4 mr-1" /> View Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
