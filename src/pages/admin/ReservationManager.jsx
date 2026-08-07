import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, X, Clock, Calendar as CalendarIcon, Filter, ExternalLink, Edit3, Sparkles, History, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';
import SessionFilter from '../../components/admin/SessionFilter';

export default function ReservationManager() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [specificDate, setSpecificDate] = useState('');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const { data } = await api.get('/reservasi');
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/reservasi/${id}/status`, { status: newStatus });
      fetchReservations();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'MENUNGGU': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-800">Pending</span>;
      case 'DIKONFIRMASI':
      case 'DATANG': return <span className="px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800">Confirmed / Seated</span>;
      case 'BATAL': return <span className="px-2.5 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 text-xs font-bold rounded-full border border-red-200 dark:border-red-800">Cancelled</span>;
      case 'SELESAI': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">Completed</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filtered = reservations.filter(r => {
    const custName = r.customer?.nama || '';
    const matchesSearch = custName.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toString().includes(searchQuery);
    
    const sessionName = r.jadwal_sesi?.sesi_makan?.nama || 'Unknown';
    const matchesSession = sessionFilter === 'ALL' || sessionName === sessionFilter;

    const resDate = r.jadwal_sesi?.tanggal || '';
    let matchesDate = true;

    if (specificDate) {
      matchesDate = resDate === specificDate;
    } else {
      if (timeFilter === 'Today') {
        matchesDate = resDate === today;
      } else if (timeFilter === 'Future') {
        matchesDate = resDate > today || (resDate === today && ['MENUNGGU', 'DIKONFIRMASI'].includes(r.status));
      } else if (timeFilter === 'History') {
        matchesDate = resDate < today || ['SELESAI', 'BATAL'].includes(r.status);
      } else if (timeFilter === 'Weekly') {
        const d = new Date(today);
        d.setDate(d.getDate() + 7);
        const nextWeek = d.toISOString().split('T')[0];
        matchesDate = resDate >= today && resDate <= nextWeek;
      } else if (timeFilter === 'Monthly') {
        matchesDate = resDate.startsWith(today.substring(0, 7));
      }
    }

    return matchesSearch && matchesSession && matchesDate;
  });

  const handleShiftDate = (days) => {
    const baseDate = specificDate ? new Date(specificDate) : new Date(today);
    baseDate.setDate(baseDate.getDate() + days);
    const formatted = baseDate.toISOString().split('T')[0];
    setSpecificDate(formatted);
    setTimeFilter('Custom Date');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-serif text-gray-800 dark:text-gray-100">Reservation Board & Schedule</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Filter by date, view historical bookings, or manage future seatings</p>
          </div>

          <div className="relative w-full lg:w-72">
            <input
              type="text"
              placeholder="Search by customer name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Quick Date Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs font-bold">
          <button
            onClick={() => { setTimeFilter('Today'); setSpecificDate(today); }}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center cursor-pointer ${timeFilter === 'Today' && !specificDate ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Today's Board ({today})
          </button>
          <button
            onClick={() => { setTimeFilter('Future'); setSpecificDate(''); }}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center cursor-pointer ${timeFilter === 'Future' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'}`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> See Future Reservations
          </button>
          <button
            onClick={() => { setTimeFilter('History'); setSpecificDate(''); }}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center cursor-pointer ${timeFilter === 'History' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}
          >
            <History className="w-3.5 h-3.5 mr-1.5" /> History Log (Past & Done)
          </button>

          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button onClick={() => handleShiftDate(-1)} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-bold flex items-center cursor-pointer" title="Previous Day">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-gray-600 dark:text-gray-300 font-mono">{specificDate || today}</span>
            <button onClick={() => handleShiftDate(1)} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-bold flex items-center cursor-pointer" title="Next Day">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col lg:flex-row gap-6 bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
            <div className="flex items-center">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  if (e.target.value !== 'Custom Date') setSpecificDate('');
                }}
                className="text-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg py-1.5 focus:border-primary focus:ring-1 focus:ring-primary bg-white font-medium"
              >
                <option value="Today">Today's Board</option>
                <option value="Future">Future Reservations</option>
                <option value="History">History Log (Past/Done)</option>
                <option value="Weekly">This Week</option>
                <option value="Monthly">This Month</option>
                <option value="All Time">All Time</option>
              </select>
            </div>
            
            <div className="hidden sm:block text-gray-300 dark:text-gray-600">|</div>

            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  setTimeFilter('Custom Date');
                }}
                className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white font-medium"
              />
              {specificDate && (
                <button
                  onClick={() => { setSpecificDate(''); setTimeFilter('Today'); }}
                  className="ml-2 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-px bg-gray-200 dark:bg-gray-700"></div>

          <SessionFilter selectedSession={sessionFilter} onSelectSession={setSessionFilter} />
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="p-4">ID</th>
              <th className="p-4">Customer Details</th>
              <th className="p-4">Date & Session</th>
              <th className="p-4">Assigned Table</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan="6" className="text-center p-8 text-gray-500 dark:text-gray-400">Loading reservations...</td></tr>
            ) : filtered.map(res => (
              <tr key={res.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                <td className="p-4 font-bold text-gray-900 dark:text-gray-100">RES-{res.id}</td>
                <td className="p-4">
                  <p className="font-bold text-gray-800 dark:text-gray-100">{res.customer?.nama || 'Guest'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{res.customer?.no_telp}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{res.jadwal_sesi?.tanggal}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                    <Clock className="w-3 h-3 mr-1" />
                    {res.jadwal_sesi?.sesi_makan?.nama}
                  </p>
                </td>
                <td className="p-4 text-sm font-bold text-primary dark:text-accent">
                  {res.reservasi_meja?.[0]?.meja?.no_meja ? `Table ${res.reservasi_meja[0].meja.no_meja}` : 'Unassigned'}
                </td>
                <td className="p-4">
                  <select
                    value={res.status}
                    onChange={(e) => updateStatus(res.id, e.target.value)}
                    className="text-xs font-bold border dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary"
                  >
                    <option value="MENUNGGU">MENUNGGU</option>
                    <option value="DIKONFIRMASI">DIKONFIRMASI</option>
                    <option value="DATANG">DATANG</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="BATAL">BATAL</option>
                  </select>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => navigate(`/admin/reservations/${res.id}`)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg text-xs font-bold inline-flex items-center transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit / Details
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400 italic">No reservations match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
