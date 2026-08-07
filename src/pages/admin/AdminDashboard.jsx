import React, { useState, useEffect } from 'react';
import { CalendarCheck, Play, FastForward, CheckCircle2, Clock, User, Users, Utensils } from 'lucide-react';
import api from '../../api';

export default function AdminDashboard() {
  const [activeJadwal, setActiveJadwal] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Official Fine Dining 4 Lockstep Course Phases
  const COURSES = ['APPETIZER', 'MAIN_COURSE', 'DESSERT', 'FREE_TIME'];

  const fetchSessionData = async () => {
    try {
      // 1. Get today's jadwal_sesi
      const today = new Date().toISOString().split('T')[0];
      const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
      
      if (jadwals.length > 0) {
        const current = jadwals[0];
        setActiveJadwal(current);

        // 2. Get active dining sessions for this jadwal
        const { data: activeSessions } = await api.get('/dining-session?status=BERJALAN');
        const relevantSessions = activeSessions.filter(ds => ds.reservasi?.id_jadwal_sesi === current.id);
        
        // 3. Get all orders for these dining sessions
        const { data: allOrders } = await api.get('/orders');
        
        const sessionOrderIds = relevantSessions.map(ds => ds.id);
        const activeOrders = allOrders.filter(o => sessionOrderIds.includes(o.id_dining_session));
        setOrders(activeOrders);
      } else {
        setActiveJadwal(null);
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Determine current phase based on the latest course added to orders
  let currentPhase = 'PRE_SESSION';
  if (orders.length > 0) {
    const allCourses = orders.flatMap(o => o.order_course || []).map(c => c.course);
    if (allCourses.length > 0) {
      let maxIndex = -1;
      for (const c of allCourses) {
        const idx = COURSES.indexOf(c);
        if (idx > maxIndex) maxIndex = idx;
      }
      if (maxIndex >= 0) currentPhase = COURSES[maxIndex];
    }
  } else if (activeJadwal) {
    currentPhase = 'PRE_SESSION';
  }

  const handleNextPhase = async () => {
    if (!activeJadwal) return;
    const currentIndex = COURSES.indexOf(currentPhase);
    
    let nextPhase = COURSES[0];
    if (currentIndex >= 0 && currentIndex < COURSES.length - 1) {
      nextPhase = COURSES[currentIndex + 1];
    } else if (currentIndex === COURSES.length - 1) {
      nextPhase = 'ENDED';
    }
    
    if (nextPhase === 'ENDED') {
      if(!window.confirm(`Are you sure you want to END the Fine Dining Session?`)) return;
      const { data: activeSessions } = await api.get('/dining-session?status=BERJALAN');
      for(const ds of activeSessions) {
         if (ds.reservasi?.id_jadwal_sesi === activeJadwal.id) {
           await api.patch(`/dining-session/${ds.id}/end`);
         }
      }
      fetchSessionData();
      return;
    }

    if(!window.confirm(`Advance session phase to ${nextPhase}?`)) return;

    try {
      // Create the order_course for each active table order
      for(const o of orders) {
        if(!o.order_course?.some(c => c.course === nextPhase)) {
          await api.post(`/orders/${o.id}/courses`, { course: nextPhase, menu_id: 1, qty: 1 });
        }
      }
      fetchSessionData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Session Maestro...</div>;

  // Determine if Admin can advance (HARD GATE validation)
  let canAdvance = false;
  let gatingReason = "";

  if (activeJadwal) {
    if (currentPhase === 'PRE_SESSION') {
      canAdvance = orders.length > 0;
      if (!canAdvance) gatingReason = "Waiting for at least 1 seated table (dining session check-in).";
    } else if (currentPhase === 'FREE_TIME') {
      canAdvance = true; // Can end session
    } else if (COURSES.includes(currentPhase)) {
      if (orders.length === 0) {
        canAdvance = true;
      } else {
        let allServed = true;
        for (const o of orders) {
          const currentCourse = o.order_course?.find(c => c.course === currentPhase);
          const tableNo = o.reservasi?.reservasi_meja?.[0]?.meja?.no_meja || '?';
          if (!currentCourse) {
            allServed = false;
            gatingReason = `Table ${tableNo} is missing ${currentPhase} record`;
            break;
          }
          if (currentCourse.status !== 'DISAJIKAN') {
            allServed = false;
            gatingReason = `Table ${tableNo} course status is ${currentCourse.status} (Needs DISAJIKAN by Waiter)`;
            break;
          }
        }
        canAdvance = allServed;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif text-gray-800 dark:text-gray-100">Session Controller (Maestro)</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Central gating for the Fine Dining experience</p>
      </div>

      {!activeJadwal ? (
        <div className="bg-orange-50 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400 p-6 rounded-xl border border-orange-100 dark:border-orange-800 flex items-center">
          <CalendarCheck className="w-6 h-6 mr-3" />
          <p className="font-medium">No Active Schedule for Today. Please activate a schedule in the settings.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Top Banner */}
          <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
            <div>
              <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Live Session</div>
              <h3 className="text-2xl font-bold">{activeJadwal.tanggal} | {activeJadwal.sesi_makan?.nama}</h3>
              <p className="text-sm text-gray-400">{activeJadwal.sesi_makan?.waktu_mulai} - {activeJadwal.sesi_makan?.waktu_selesai}</p>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Current Phase</div>
              <div className="text-3xl font-serif text-primary dark:text-accent animate-pulse">{currentPhase.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Master Control */}
          <div className="p-8 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={handleNextPhase}
              disabled={!canAdvance || currentPhase === 'ENDED'}
              className="flex items-center space-x-3 bg-primary hover:bg-secondary disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-10 py-5 rounded-2xl shadow-lg transition-all duration-300 transform active:scale-95"
            >
              {currentPhase === 'PRE_SESSION' ? <Play className="w-8 h-8" /> : <FastForward className="w-8 h-8" />}
              <span className="text-2xl font-bold">
                {currentPhase === 'PRE_SESSION' ? 'START SESSION (FIRE APPETIZER)' : 'ADVANCE TO NEXT PHASE'}
              </span>
            </button>
            {!canAdvance && currentPhase !== 'ENDED' && (
              <p className="mt-4 text-sm font-medium text-red-500 dark:text-red-400 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Hard Gated: {gatingReason}
              </p>
            )}
          </div>

          {/* Active Tables Status */}
          <div className="p-6">
            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
              Table Readiness Check
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map(order => {
                const course = order.order_course?.find(c => c.course === currentPhase);
                const noMeja = order.reservasi?.reservasi_meja?.[0]?.meja?.no_meja || '?';
                const customerNama = order.reservasi?.customer?.nama || `Resv #${order.reservasi?.id}`;
                const totalGuests = order.reservasi?.jumlah_tamu || 1;
                const pilihanMenu = order.reservasi?.pilihan_menu || 'Set Menu A';

                return (
                  <div key={order.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col space-y-3">
                    <div className="font-bold text-gray-800 dark:text-gray-100 border-b dark:border-gray-800 pb-2 flex justify-between">
                      <span>Table {noMeja}</span>
                      <span className="text-xs font-mono text-gray-400">Ord #{order.id}</span>
                    </div>

                    <div className="space-y-1.5 text-xs bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-primary dark:text-accent" />
                        {customerNama}
                      </p>
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 font-semibold pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                        <span className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                          Total Guests: <strong className="text-gray-900 dark:text-gray-100 ml-1">{totalGuests} Pax</strong>
                        </span>
                        <span className="bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent px-2 py-0.5 rounded font-bold flex items-center">
                          <Utensils className="w-3 h-3 mr-1" />
                          {pilihanMenu}
                        </span>
                      </div>
                    </div>

                    {currentPhase === 'PRE_SESSION' ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic bg-blue-50 dark:bg-blue-900/40 p-2 rounded text-center">Waiting for Admin to start...</div>
                    ) : (
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Course Status</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${
                          course?.status === 'DISAJIKAN' ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800'
                          : course?.status === 'SIAP' ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'
                          : 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800'
                        }`}>
                          {course?.status || 'MENUNGGU'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {orders.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                  No active dining sessions for this schedule. Waiting for guests to check-in.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
