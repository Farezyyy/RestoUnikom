import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Users, Plus, CheckCircle, XCircle, Settings, Edit3, Trash2, Calendar, Filter, ChevronLeft, ChevronRight, ListFilter, LayoutGrid, User, Utensils, Lock } from 'lucide-react';
import api from '../../api';
import WalkInModal from '../waiter/WalkInModal';
import ReservationManager from '../../pages/admin/ReservationManager';

export default function ReservationBoard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'

  // Detect current base path (admin or waiter)
  const basePath = window.location.pathname.startsWith('/waiter') ? '/waiter' : '/admin';

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  // Snapshots so the 5s poll only updates state when data actually changed.
  // Otherwise every poll sets fresh arrays and re-renders, resetting scroll to top.
  const snapshots = useRef({ sessions: '', reservations: '', tables: '' });

  const setIfChanged = (key, next, setter) => {
    const serialized = JSON.stringify(next);
    if (snapshots.current[key] !== serialized) {
      snapshots.current[key] = serialized;
      setter(next);
    }
  };

  const fetchDataForDate = async (date, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: jadwalData } = await api.get(`/jadwal-sesi?tanggal=${date}`);
      setIfChanged('sessions', jadwalData || [], setSessions);

      if (jadwalData && jadwalData.length > 0) {
        setActiveSessionId(prev => (jadwalData.some(s => s.id === prev) ? prev : jadwalData[0].id));
      } else {
        setActiveSessionId(null);
      }

      const { data: allResData } = await api.get('/reservasi');
      const todaySessionIds = (jadwalData || []).map(s => s.id);
      const filteredRes = (allResData || []).filter(r =>
        todaySessionIds.includes(r.id_jadwal_sesi) || r.jadwal_sesi?.tanggal === date
      );
      setIfChanged('reservations', filteredRes, setReservations);

      const { data: tblData } = await api.get('/meja');
      setIfChanged('tables', tblData || [], setTables);

    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataForDate(selectedDate);
    const interval = setInterval(() => fetchDataForDate(selectedDate, false), 5000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleQuickCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
       await api.patch(`/reservasi/${id}/status`, { status: 'BATAL' });
       fetchDataForDate(selectedDate);
    } catch(e) {
       console.error(e);
       alert("Failed to cancel reservation");
    }
  };

  // Accept a reservation and open its bill: mark it DIKONFIRMASI, then create the
  // order. The backend fills the order's courses from the chosen set menu
  // (Menu A/B) so it shows up in the Cashier with the correct price.
  const handleAccept = async (reservation) => {
    try {
      if (reservation.status === 'MENUNGGU') {
        await api.patch(`/reservasi/${reservation.id}/status`, { status: 'DIKONFIRMASI' });
      }
      await api.post('/orders', { id_reservasi: reservation.id });
      alert('Reservation accepted. Order created and sent to the Cashier.');
      fetchDataForDate(selectedDate);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to accept reservation.');
    }
  };

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;
  const isPast = selectedDate < today;

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('board')}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 mr-1" /> Switch to Visual Board View
            </button>
          </div>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Full Reservation Manager & Filters</span>
        </div>
        <ReservationManager />
      </div>
    );
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeSessionReservations = reservations.filter(r => r.id_jadwal_sesi === activeSessionId && r.status !== 'BATAL');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[calc(100vh-8rem)] relative">
      {/* Header with Date Selector Controls */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-serif text-gray-800 dark:text-gray-100">
                {isToday ? "Today's Reservation Board" : isFuture ? "Future Reservation Board" : "Historical Reservation Board"}
              </h2>
              {isToday && <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 text-xs font-bold rounded-full">TODAY</span>}
              {isFuture && <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 text-xs font-bold rounded-full">FUTURE</span>}
              {isPast && <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full">HISTORY</span>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formattedSelectedDate}</p>
          </div>
          
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <button
              onClick={() => setViewMode('list')}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center shadow-sm cursor-pointer"
            >
              <ListFilter className="w-4 h-4 mr-1.5 text-primary dark:text-accent" /> Table List & History
            </button>

            {isPast ? (
              <span className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-500 dark:text-gray-400" /> Historical Log (Read-Only)
              </span>
            ) : (
              <button 
                onClick={() => setShowWalkInModal(true)}
                disabled={!activeSession}
                className="bg-primary hover:bg-secondary disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Walk-In (Active Session)
              </button>
            )}
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200/60 dark:border-gray-800 text-xs font-bold">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(today)}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center cursor-pointer ${isToday ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Today ({today})
            </button>

            <div className="flex items-center space-x-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <button onClick={() => handleShiftDate(-1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300 font-bold flex items-center cursor-pointer" title="Previous Day">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono font-bold bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary"
              />
              <button onClick={() => handleShiftDate(1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300 font-bold flex items-center cursor-pointer" title="Next Day">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing seatings for: <strong className="text-gray-900 dark:text-gray-100">{selectedDate}</strong>
          </div>
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto bg-white dark:bg-gray-900">
        {sessions.map((session, index) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`px-8 py-4 font-bold text-sm whitespace-nowrap transition-colors flex flex-col items-center border-b-2 cursor-pointer ${
              activeSessionId === session.id ? 'border-primary text-primary dark:text-accent bg-primary/5' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <span>Session {index + 1}</span>
            <span className="text-xs font-medium opacity-70">{session.sesi_makan?.waktu_mulai.substring(0,5)} - {session.sesi_makan?.waktu_selesai.substring(0,5)}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400 italic">No operational sessions found for {selectedDate}.</div>
        )}
      </div>

      {/* Main Board - Table Grid */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">Loading session tables for {selectedDate}...</div>
        ) : activeSession ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tables.map(table => {
              const reservation = activeSessionReservations.find(r => r.reservasi_meja?.some(rm => rm.meja?.id === table.id || rm.id_meja === table.id));
              
              if (reservation) {
                // OCCUPIED / RESERVED TABLE CARD
                return (
                  <div key={table.id} className="bg-white dark:bg-gray-900 border border-primary/30 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-primary/5">
                      <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                        Table {table.no_meja}
                      </span>
                      <span className="text-xs font-extrabold px-2.5 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded uppercase">
                        {reservation.status === 'DATANG' ? 'Seated / Hadir' : 'Occupied'}
                      </span>
                    </div>

                    <div className="p-4 flex-1 space-y-3">
                      {/* Customer Name, Guests, & Menu Selection */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center">
                          <User className="w-4 h-4 mr-1.5 text-primary dark:text-accent" />
                          {reservation.customer?.nama || 'Guest'}
                        </p>
                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 font-semibold pt-1 border-t border-gray-200/60 dark:border-gray-800">
                          <span className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                            Total Guests: <strong className="text-gray-900 dark:text-gray-100 ml-1">{reservation.jumlah_tamu || 1} Pax</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold flex items-center ${reservation.pilihan_menu ? 'bg-primary/10 text-primary dark:text-accent' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                            <Utensils className="w-3 h-3 mr-1" />
                            {reservation.pilihan_menu || 'No Menu'}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium flex justify-between items-center px-1">
                        <span>Status: <strong className="text-gray-800 dark:text-gray-100">{reservation.status}</strong></span>
                        <span className="font-mono text-gray-400">RES-{reservation.id}</span>
                      </div>
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-2">
                       {!isPast && reservation.status !== 'BATAL' && reservation.status !== 'SELESAI' && !(reservation.orders?.length > 0) && (
                         <button onClick={() => handleAccept(reservation)} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm">
                           <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept &amp; Create Order
                         </button>
                       )}
                       {reservation.orders?.length > 0 && (
                         <div className="w-full py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold text-center flex items-center justify-center">
                           <CheckCircle className="w-3.5 h-3.5 mr-1" /> Order sent to Cashier
                         </div>
                       )}
                       <div className="flex gap-2">
                         <button onClick={() => navigate(`${basePath}/reservations/${reservation.id}`)} className="flex-1 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center cursor-pointer">
                           <Settings className="w-3.5 h-3.5 mr-1" /> Manage (Update/Move)
                         </button>
                         <button onClick={() => handleQuickCancel(reservation.id)} className="flex-1 py-2 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/60 flex items-center justify-center cursor-pointer">
                           <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancel
                         </button>
                       </div>
                    </div>
                  </div>
                );
              } else {
                // EMPTY / AVAILABLE TABLE CARD
                return (
                  <div key={table.id} className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                      <span className="font-bold text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        Table {table.no_meja}
                      </span>
                      <span className="text-xs font-extrabold px-2.5 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded uppercase">Available</span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[120px]">
                      <Users className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-sm font-semibold">Capacity: {table.kapasitas} Pax</p>
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                       {isPast ? (
                         <div className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg text-xs font-bold text-center border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                           <Lock className="w-3.5 h-3.5 mr-1 text-gray-400" /> Historical Session (Read-Only)
                         </div>
                       ) : (
                         <button onClick={() => setShowWalkInModal(true)} className="w-full py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center cursor-pointer">
                           <Plus className="w-3.5 h-3.5 mr-1" /> Walk-In This Table
                         </button>
                       )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-400 py-20 italic">No active session selected for {selectedDate}.</div>
        )}
      </div>

      <WalkInModal 
        isOpen={showWalkInModal} 
        onClose={() => setShowWalkInModal(false)}
        activeJadwal={activeSession}
        onCheckInComplete={() => {
           setShowWalkInModal(false);
           fetchDataForDate(selectedDate);
        }}
      />
    </div>
  );
}
