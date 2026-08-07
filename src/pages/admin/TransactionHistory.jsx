import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowDownToLine, Receipt, X, DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import api from '../../api';

export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
          createdAt: t.created_at,
          date: dateObj.toLocaleDateString(),
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          table: reservasi.reservasi_meja?.[0]?.meja?.no_meja || 'N/A',
          customer: reservasi.customer?.nama || 'Walk-in',
          items: order.order_course?.reduce((sum, c) => sum + (c.qty || 1), 0) || 0,
          courses: order.order_course || [],
          total: Number(t.total) || 0,
          method: t.metode_pembayaran || 'CASH',
          status: t.status,
          cashier: t.creator?.nama || t.creator?.username || '—',
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

  const filtered = useMemo(() => transactions.filter(t => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.status.toLowerCase().includes(searchQuery.toLowerCase());

    // Date range filter (compare on the calendar day)
    const trxDay = t.createdAt ? t.createdAt.slice(0, 10) : '';
    const afterStart = !startDate || trxDay >= startDate;
    const beforeEnd = !endDate || trxDay <= endDate;

    return matchesSearch && afterStart && beforeEnd;
  }), [transactions, searchQuery, startDate, endDate]);

  // Revenue summary (only paid/LUNAS transactions count as revenue)
  const summary = useMemo(() => {
    const paid = filtered.filter(t => t.status === 'LUNAS');
    const totalRevenue = paid.reduce((sum, t) => sum + t.total, 0);
    const byMethod = { CARD: 0, QRIS: 0, CASH: 0 };
    paid.forEach(t => { byMethod[t.method] = (byMethod[t.method] || 0) + t.total; });
    return {
      totalRevenue,
      count: filtered.length,
      paidCount: paid.length,
      avg: paid.length ? Math.round(totalRevenue / paid.length) : 0,
      byMethod,
    };
  }, [filtered]);

  const exportCSV = () => {
    const rows = [
      ['Transaction ID', 'Date', 'Time', 'Customer', 'Table', 'Items', 'Method', 'Status', 'Total'],
      ...filtered.map(t => [t.id, t.date, t.time, t.customer, t.table, t.items, t.method, t.status, t.total]),
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMethodBadge = (method) => {
    switch(method) {
      case 'CARD': return <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 text-xs font-bold rounded">CARD</span>;
      case 'QRIS': return <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400 text-xs font-bold rounded">QRIS</span>;
      case 'CASH': return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold rounded">CASH</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 text-xs font-bold rounded">{method}</span>;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'LUNAS') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold rounded">PAID</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs font-bold rounded">{status}</span>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-serif text-gray-800 dark:text-gray-100">Transaction History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review past revenue and completed orders</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-56">
              <input
                type="text"
                placeholder="Search by ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
              title="Start date"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
              title="End date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary underline"
              >
                Reset
              </button>
            )}
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors flex items-center justify-center bg-gray-50 dark:bg-gray-800 disabled:opacity-50"
              title="Export CSV"
            >
              <ArrowDownToLine className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Total Revenue</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Rp {summary.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
              <Receipt className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Transactions</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.count} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({summary.paidCount} paid)</span></p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/40 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Avg. Transaction</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Rp {summary.avg.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">By Method</span>
            </div>
            <div className="text-xs space-y-0.5 text-gray-600 dark:text-gray-400">
              <div className="flex justify-between"><span>Card</span><span className="font-medium">Rp {summary.byMethod.CARD.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>QRIS</span><span className="font-medium">Rp {summary.byMethod.QRIS.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cash</span><span className="font-medium">Rp {summary.byMethod.CASH.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300">
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
                <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">Loading transactions...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400 italic">No transactions found matching your search.</td>
              </tr>
            ) : filtered.map(trx => (
              <tr key={trx.rawId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="p-4 font-bold text-gray-900 dark:text-gray-100">{trx.id}</td>
                <td className="p-4">
                  <p className="font-medium text-gray-800 dark:text-gray-100">{trx.date}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{trx.time}</p>
                </td>
                <td className="p-4">
                  <p className="font-medium text-gray-800 dark:text-gray-100">{trx.customer}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Table {trx.table} • {trx.items} Items</p>
                </td>
                <td className="p-4">{getMethodBadge(trx.method)}</td>
                <td className="p-4">{getStatusBadge(trx.status)}</td>
                <td className="p-4 text-right">
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">Rp {trx.total.toLocaleString()}</span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedTrx(trx)}
                    className="text-primary dark:text-accent hover:text-secondary transition-colors p-2 inline-flex items-center text-sm font-medium"
                  >
                    <Receipt className="w-4 h-4 mr-1" /> View Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipt Detail Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTrx(null)}></div>
          <div className="bg-white dark:bg-gray-900 relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setSelectedTrx(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* Receipt Header */}
              <div className="text-center mb-6 border-b border-dashed border-gray-300 dark:border-gray-700 pb-4">
                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 tracking-widest uppercase">Resto Unikom</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Table {selectedTrx.table} • {selectedTrx.customer}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{selectedTrx.date} {selectedTrx.time}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{selectedTrx.id}</p>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {selectedTrx.courses.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic">No item details recorded for this order.</p>
                ) : selectedTrx.courses.map((c, idx) => {
                  const name = c.menu?.nama || `Menu #${c.menu_id}`;
                  const price = c.menu?.harga || 0;
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{name}</span>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{c.qty} x Rp {price.toLocaleString()}</div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Rp {(c.qty * price).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Total breakdown (total already includes tax & service from backend) */}
              <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Payment Method</span>
                  <span>{getMethodBadge(selectedTrx.method)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Status</span>
                  <span>{getStatusBadge(selectedTrx.status)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Cashier</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{selectedTrx.cashier}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <span>Total (incl. tax & service)</span>
                  <span>Rp {selectedTrx.total.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">Thank you for dining with us!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
