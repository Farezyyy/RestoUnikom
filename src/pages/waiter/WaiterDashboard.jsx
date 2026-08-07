import React, { useState, useEffect, useRef } from 'react';
import { Info, QrCode, Utensils, CheckCircle, Trash2, UserPlus } from 'lucide-react';
import FloorPlan, { statusIndicators } from '../../components/waiter/FloorPlan';
import { mapDBTableToVisual } from '../../utils/tableCoordinates';
import WalkInModal from '../../components/waiter/WalkInModal';
import api from '../../api';
import { supabase } from '../../supabaseClient';

export default function WaiterDashboard() {
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [activeJadwal, setActiveJadwal] = useState(null);
  const [activeDiningSessions, setActiveDiningSessions] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedTableVisual, setSelectedTableVisual] = useState(null);

  // Keep snapshots of the last fetched data so polling only updates state when
  // something actually changed. Setting state with a fresh array every 1.5s
  // forces a re-render that resets the scroll position back to the top.
  const snapshots = useRef({ tables: '', reservations: '', diningSessions: '', orders: '', jadwal: '' });

  const setIfChanged = (key, next, setter) => {
    const serialized = JSON.stringify(next);
    if (snapshots.current[key] !== serialized) {
      snapshots.current[key] = serialized;
      setter(next);
    }
  };

  const COURSES = ['APPETIZER', 'MAIN_A', 'MAIN_B', 'DESSERT', 'BEVERAGE'];
  
  const fetchData = async () => {
    try {
      // 1. Get Tables
      const { data: dbTables } = await api.get('/meja');
      
      // 2. Get Active Schedule (Today's)
      const today = new Date().toISOString().split('T')[0];
      const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
      const currentJadwal = jadwals.length > 0 ? jadwals[0] : null;
      setIfChanged('jadwal', currentJadwal, setActiveJadwal);

      let activeRes = [];
      let activeOrd = [];
      let activeDS = [];
      
      if (currentJadwal) {
        // 3. Get Reservations for this Jadwal
        try {
          const { data: allRes } = await api.get(`/reservasi?id_jadwal_sesi=${currentJadwal.id}`);
          if (Array.isArray(allRes)) {
            activeRes = allRes.filter(r => ['MENUNGGU', 'DATANG', 'DIKONFIRMASI'].includes(r.status));
          }
        } catch (e) { console.error("Error fetching reservasi:", e); }
        setIfChanged('reservations', activeRes, setReservations);

        // 4. Get active Dining Sessions
        try {
          const { data: dsData } = await api.get('/dining-session?status=BERJALAN');
          if (Array.isArray(dsData)) activeDS = dsData;
        } catch (e) { console.error("Error fetching dining-session:", e); }
        setIfChanged('diningSessions', activeDS, setActiveDiningSessions);

        // 5. Get Orders
        try {
          const { data: allOrd } = await api.get('/orders');
          if (Array.isArray(allOrd)) {
            const dsIds = activeDS.map(ds => ds.id);
            activeOrd = allOrd.filter(o => dsIds.includes(o.id_dining_session));
          }
        } catch (e) { console.error("Error fetching orders:", e); }
        setIfChanged('orders', activeOrd, setOrders);
      } else {
        setIfChanged('reservations', [], setReservations);
        setIfChanged('diningSessions', [], setActiveDiningSessions);
        setIfChanged('orders', [], setOrders);
      }

      // Determine Global Phase based on Orders
      let currentPhase = 'PRE_SESSION';
      if (activeOrd.length > 0) {
        const allCourses = activeOrd.flatMap(o => o.order_course || []).map(c => c.course);
        if (allCourses.length > 0) {
          let maxIndex = -1;
          for (const c of allCourses) {
            const idx = COURSES.indexOf(c);
            if (idx > maxIndex) maxIndex = idx;
          }
          if (maxIndex >= 0) currentPhase = COURSES[maxIndex];
        }
      }

      // Map Tables with Session Data
      const visualTables = (dbTables || []).map(dbT => {
        let status = 'available';
        let customer = null;
        
        if (currentJadwal && activeRes.length > 0) {
          const res = activeRes.find(r => r.reservasi_meja?.some(rm => (rm?.meja?.id === dbT.id) || (rm?.id_meja === dbT.id)));
          if (res) {
            customer = res.customer?.nama || `Resv #${res.id}`;
            if (res.status === 'MENUNGGU' || res.status === 'DIKONFIRMASI') {
              status = 'reserved';
            } else if (res.status === 'DATANG') {
              status = 'occupied';
            }
          }
        }

        return {
          ...mapDBTableToVisual(dbT),
          status,
          customer,
          globalPhase: currentPhase
        };
      });
      setIfChanged('tables', visualTables, setTables);

      // Update selected table visual if it's currently selected
      if (selectedTableVisual) {
        const updated = visualTables.find(t => t.id === selectedTableVisual.id);
        if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTableVisual)) {
          setSelectedTableVisual(updated);
        }
      }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    // Supabase Realtime subscription for instant table & order updates
    const channel = supabase
      .channel('waiter_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meja' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservasi' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dining_session' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_course' }, fetchData)
      .subscribe();

    const interval = setInterval(fetchData, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [selectedTableVisual?.id]);

  const handleSimulateQR = async () => {
    const token = prompt("Enter the guest's reservation QR code to check them in:");
    if (!token) return;

    try {
      await api.post(`/dining-session/checkin/${token.trim()}`);
      alert("Check-in successful! Guest marked as arrived (DATANG) and dining session started.");
      fetchData();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Check-in failed. Invalid or already used QR code.");
    }
  };

  const getTableActiveOrder = () => {
    if (!selectedTableVisual || !activeJadwal) return null;
    const res = reservations.find(r => r.reservasi_meja?.some(rm => (rm?.meja?.id === selectedTableVisual.id) || (rm?.id_meja === selectedTableVisual.id)));
    if (!res) return null;
    const ds = activeDiningSessions.find(d => d.id_reservasi === res.id);
    if (!ds) return { reservation: res, diningSession: null, order: null };
    
    const order = orders.find(o => o.id_dining_session === ds.id);
    return { order, reservation: res, diningSession: ds };
  };

  const updateCourseStatus = async (courseId, status) => {
    try {
      await api.patch(`/orders/courses/${courseId}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestBill = async (reservationId, tableLabel) => {
    try {
      await api.post('/notifikasi', {
        role: 'KASIR',
        judul: `Bill Requested - ${tableLabel}`,
        pesan: `Table ${tableLabel} meminta bill untuk dicetak. Reservation ID: ${reservationId}`,
        tipe: 'BILL'
      });
      alert("Bill request sent! Kasir akan segera menerima notifikasi.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim notifikasi. Coba lagi.");
    }
  };

  const handleConfirmPaymentAtTable = async (orderId, method) => {
    try {
      // 1. Create or get transaction
      let trxId;
      try {
        const { data: trx } = await api.post('/transaksi', { id_order: orderId, metode_pembayaran: method });
        trxId = trx.id;
      } catch (e) {
        const { data: existing } = await api.get('/transaksi');
        const match = existing.find(t => t.id_order === orderId);
        if (match) trxId = match.id;
      }

      if (trxId) {
        await api.patch(`/transaksi/${trxId}/process`, { metode_pembayaran: method });
        alert(`Payment of ${method} confirmed at table! Transaction marked LUNAS.`);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to process payment at table:", err);
    }
  };

  const handleTableTurnover = async (tableId) => {
    try {
      await api.patch(`/meja/${tableId}`, { status: 'KOSONG', aktif: true });
      alert("Table cleaned and marked ready for turnover!");
      setSelectedTableVisual(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const renderTableActions = () => {
    if (!activeJadwal) return <p className="text-gray-500 dark:text-gray-400 italic text-sm">No active schedule.</p>;

    const tableData = getTableActiveOrder();
    if (!tableData?.reservation) {
      return (
        <div className="space-y-3">
          <p className="text-gray-500 dark:text-gray-400 italic text-sm">No active reservation for this table currently.</p>
          <button
            onClick={() => handleTableTurnover(selectedTableVisual.id)}
            className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors"
          >
            Mark Cleaned / Turnover Ready
          </button>
        </div>
      );
    }

    if (!tableData.diningSession) {
      // Reservation exists, but guests haven't checked in
      return (
        <div className="space-y-3">
          <div className="w-full py-2.5 bg-yellow-50 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-lg font-bold text-center text-xs">
             Waiting for Guests (QR Check-in)
          </div>
          <button
            onClick={async () => {
              if (window.confirm("Cancel this reservation as No-Show?")) {
                await api.patch(`/reservasi/${tableData.reservation.id}/status`, { status: 'BATAL' });
                fetchData();
              }
            }}
            className="w-full py-2.5 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg font-bold flex justify-center items-center text-xs hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Cancel (No-Show)
          </button>
        </div>
      );
    }

    const currentPhase = selectedTableVisual?.globalPhase || 'PRE_SESSION';

    if (currentPhase === 'PRE_SESSION') {
      return (
        <div className="space-y-3">
           <div className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg font-bold text-center text-xs">
             Guests Seated. Waiting for Admin to Start Session.
           </div>
        </div>
      );
    }

    if (COURSES.includes(currentPhase) && currentPhase !== 'FREE_TIME') {
      if (!tableData.order) return <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for Maestro to generate order...</p>;

      const course = tableData.order.order_course?.find(c => c.course === currentPhase);
      if (!course) return <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for {currentPhase} course generation...</p>;

      if (course.status === 'SIAP') {
        return (
          <button 
            onClick={() => updateCourseStatus(course.id, 'DISAJIKAN')}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex justify-center items-center shadow-md animate-pulse cursor-pointer"
          >
            <Utensils className="w-5 h-5 mr-2" /> Serve {course.course} (Mark DISAJIKAN)
          </button>
        );
      } else if (course.status === 'MENUNGGU' || course.status === 'DIMASAK') {
         return <div className="p-3 bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-lg border border-orange-200 dark:border-orange-800 text-xs font-bold text-center">Chef is {course.status === 'DIMASAK' ? 'Preparing' : 'Pending'}...</div>;
      } else if (course.status === 'DISAJIKAN') {
         return <div className="p-3 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800 text-xs font-bold text-center flex items-center justify-center">
             <CheckCircle className="w-4 h-4 mr-2" /> Served & Waiting for next phase.
         </div>;
      }
    }

    if (currentPhase === 'FREE_TIME' || currentPhase === 'ENDED') {
      return (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 text-xs font-bold text-center">
            🎉 Free Time / Individual Orders Active
          </div>

          <button 
            onClick={() => handleRequestBill(tableData.reservation.id, selectedTableVisual.label)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex justify-center items-center shadow-sm cursor-pointer"
          >
            <Info className="w-4 h-4 mr-2" /> Flag "Bill Requested" (Notify Cashier)
          </button>

          {tableData.order && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Confirm Payment at Table:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleConfirmPaymentAtTable(tableData.order.id, 'Cash')}
                  className="py-2 bg-green-50 dark:bg-green-900/40 hover:bg-green-100 dark:hover:bg-green-900/60 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800 text-[11px] font-bold rounded cursor-pointer"
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => handleConfirmPaymentAtTable(tableData.order.id, 'QRIS')}
                  className="py-2 bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[11px] font-bold rounded cursor-pointer"
                >
                  📱 QRIS
                </button>
                <button
                  onClick={() => handleConfirmPaymentAtTable(tableData.order.id, 'Debit')}
                  className="py-2 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-bold rounded cursor-pointer"
                >
                  💳 Card
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => handleTableTurnover(selectedTableVisual.id)}
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Confirm Table Cleaned & Turnover Ready
          </button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Interactive Floor Plan */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Dynamic Floor Plan</h3>
            <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-1">
              {activeJadwal ? `🟢 Active Session: ${activeJadwal.sesi_makan?.nama || 'Session Operational'} (Phase: ${tables[0]?.globalPhase || 'PRE_SESSION'})` : 'No Active Schedule'}
            </p>
          </div>
          <div className="flex space-x-3 text-xs font-medium text-gray-500 dark:text-gray-400 items-center">
             <button onClick={() => setIsWalkInOpen(true)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3 py-1.5 rounded flex items-center shadow-sm">
               <UserPlus className="w-4 h-4 mr-1.5" /> Walk-In
             </button>
             <button onClick={handleSimulateQR} className="bg-primary hover:bg-secondary text-white px-3 py-1.5 rounded flex items-center shadow-sm">
               <QrCode className="w-4 h-4 mr-1.5" /> Input QR Code
             </button>
          </div>
        </div>

        <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 overflow-auto flex items-center justify-center">
          <FloorPlan tables={tables} onSelectTable={setSelectedTableVisual} />
        </div>
      </div>

      {/* Right: Selected Table Details */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Action Station</h3>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {selectedTableVisual ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{selectedTableVisual.label}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedTableVisual.status}</p>
                </div>
                <div className={`w-4 h-4 rounded-full mt-2 shadow-sm ${statusIndicators[selectedTableVisual.status]}`}></div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Capacity</span>
                  <span className="font-medium">{selectedTableVisual.cap} Guests</span>
                </div>
                {selectedTableVisual.customer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Customer</span>
                    <span className="font-bold text-primary dark:text-accent">{selectedTableVisual.customer}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 space-y-3 mt-auto">
                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2">Required Actions</h5>
                {renderTableActions()}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-400 space-y-3">
              <Info className="w-12 h-12 opacity-50" />
              <p className="text-sm text-center">Select an active table to view<br/>actions and course status.</p>
            </div>
          )}
        </div>
      </div>
      
      <WalkInModal 
        isOpen={isWalkInOpen} 
        onClose={() => setIsWalkInOpen(false)} 
        activeJadwal={activeJadwal}
        onCheckInComplete={() => {
           setIsWalkInOpen(false);
           fetchData();
        }}
      />
    </div>
  );
}
