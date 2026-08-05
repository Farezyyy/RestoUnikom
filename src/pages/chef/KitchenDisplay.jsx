import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, ChefHat, User, Users, Utensils } from 'lucide-react';
import api from '../../api';
import { supabase } from '../../supabaseClient';

export default function KitchenDisplay() {
  const [activeJadwal, setActiveJadwal] = useState(null);
  const [activeCourses, setActiveCourses] = useState([]);
  const [globalPhase, setGlobalPhase] = useState('PRE_SESSION');
  const [loading, setLoading] = useState(true);

  const COURSES = ['APPETIZER', 'MAIN_A', 'MAIN_B', 'DESSERT', 'BEVERAGE'];

  const fetchKitchenData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
      
      if (jadwals.length > 0) {
        const current = jadwals[0];
        setActiveJadwal(current);

        // Get Active Dining Sessions
        const { data: activeDS } = await api.get('/dining-session?status=BERJALAN');
        const dsIds = activeDS.filter(ds => ds.reservasi?.id_jadwal_sesi === current.id).map(ds => ds.id);

        if (dsIds.length > 0) {
          const { data: allOrders } = await api.get('/orders');
          const activeOrders = allOrders.filter(o => dsIds.includes(o.id_dining_session));

          let currentPhase = 'PRE_SESSION';
          if (activeOrders.length > 0) {
            const allCourses = activeOrders.flatMap(o => o.order_course || []).map(c => c.course);
            if (allCourses.length > 0) {
              let maxIndex = -1;
              for (const c of allCourses) {
                const idx = COURSES.indexOf(c);
                if (idx > maxIndex) maxIndex = idx;
              }
              if (maxIndex >= 0) currentPhase = COURSES[maxIndex];
            }
          }
          setGlobalPhase(currentPhase);

          if (COURSES.includes(currentPhase)) {
            const courses = activeOrders.map(order => {
              const courseData = order.order_course?.find(c => c.course === currentPhase);
              if (!courseData) return null;
              
              // find matching ds and reservation for table and guest info
              const ds = activeDS.find(d => d.id === order.id_dining_session);
              const resv = ds?.reservasi;
              const tableNo = resv?.reservasi_meja?.[0]?.meja?.no_meja;
              
              return {
                id: courseData.id,
                orderId: order.id,
                tableNo: tableNo,
                customerName: resv?.customer?.nama || `Resv #${resv?.id}`,
                guests: resv?.jumlah_tamu || 1,
                pilihanMenu: resv?.pilihan_menu || 'Set Menu A',
                course: courseData.course,
                status: courseData.status
              };
            }).filter(Boolean);
  
            setActiveCourses(courses);
          } else {
            setActiveCourses([]);
          }
        } else {
          setActiveCourses([]);
          setGlobalPhase('PRE_SESSION');
        }
      } else {
        setActiveJadwal(null);
        setActiveCourses([]);
        setGlobalPhase('PRE_SESSION');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenData();

    // Supabase Realtime Subscription for instant KDS updates
    const channel = supabase
      .channel('kds_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_course' }, fetchKitchenData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchKitchenData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dining_session' }, fetchKitchenData)
      .subscribe();

    const interval = setInterval(fetchKitchenData, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = async (courseId, newStatus) => {
    try {
      await api.patch(`/orders/courses/${courseId}`, { status: newStatus });
      fetchKitchenData();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCourses = activeCourses.filter(c => c.status === 'MENUNGGU');
  const preparingCourses = activeCourses.filter(c => c.status === 'DIMASAK');
  const readyCourses = activeCourses.filter(c => c.status === 'SIAP' || c.status === 'DISAJIKAN');

  const CourseCard = ({ course }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex flex-col space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <div>
          <span className="text-xl font-bold text-gray-800">Table {course.tableNo || '?'}</span>
          <span className="text-xs text-gray-400 font-mono ml-2">Ord #{course.orderId}</span>
        </div>
      </div>
      
      {/* Detailed Info Box */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5 text-xs">
        <p className="font-bold text-gray-900 text-sm flex items-center">
          <User className="w-3.5 h-3.5 mr-1.5 text-primary" />
          {course.customerName}
        </p>
        <div className="flex justify-between items-center text-gray-600 font-semibold pt-1 border-t border-gray-200/60">
          <span className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-1 text-gray-500" />
            Guests: <strong className="text-gray-900 ml-1">{course.guests} Pax</strong>
          </span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold flex items-center">
            <Utensils className="w-3 h-3 mr-1" />
            {course.pilihanMenu}
          </span>
        </div>
      </div>

      <div className="pt-1">
        <p className="font-bold text-primary text-base uppercase tracking-wide">{course.course.replace('_', ' ')}</p>
      </div>

      <div className="mt-auto flex justify-end gap-2 pt-3 border-t border-gray-100">
        {course.status === 'MENUNGGU' && (
          <button 
            onClick={() => updateStatus(course.id, 'DIMASAK')}
            className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center"
          >
            <ChefHat className="w-5 h-5 mr-2" /> START PREPARING
          </button>
        )}
        {course.status === 'DIMASAK' && (
          <button 
            onClick={() => updateStatus(course.id, 'SIAP')}
            className="w-full py-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-colors flex justify-center items-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" /> MARK READY
          </button>
        )}
        {course.status === 'SIAP' && (
          <div className="w-full py-3 bg-green-50 text-green-700 text-sm font-bold rounded-lg flex justify-center items-center border border-green-200">
            <CheckCircle className="w-5 h-5 mr-2" /> WAITING FOR FLOOR
          </div>
        )}
        {course.status === 'DISAJIKAN' && (
          <div className="w-full py-3 bg-gray-100 text-gray-500 text-sm font-bold rounded-lg flex justify-center items-center border border-gray-200">
            <CheckCircle className="w-5 h-5 mr-2" /> SERVED
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Kitchen Display...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif text-gray-800">Kitchen Display System</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeJadwal 
              ? `Live Schedule: ${activeJadwal.sesi_makan?.nama} | Global Phase: ${globalPhase}`
              : 'No Active Schedule'}
          </p>
        </div>
      </div>

      {!activeJadwal || !COURSES.includes(globalPhase) ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Kitchen is Idle</h3>
            <p>Waiting for Maestro to advance to a Course phase.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Column 1: Pending */}
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col h-full border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 flex items-center text-lg">
                <span className="w-3 h-3 rounded-full bg-gray-400 mr-3"></span>
                NEW TICKETS
              </h3>
              <span className="bg-white text-gray-600 px-3 py-1 rounded-lg text-sm font-bold border border-gray-200 shadow-sm">{pendingCourses.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar pr-2">
              {pendingCourses.map(course => <CourseCard key={course.id} course={course} />)}
              {pendingCourses.length === 0 && <div className="text-center text-gray-400 mt-10 italic text-sm">No new tickets</div>}
            </div>
          </div>

          {/* Column 2: Preparing */}
          <div className="bg-orange-50/50 rounded-xl p-4 flex flex-col h-full border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-orange-700 flex items-center text-lg">
                <span className="w-3 h-3 rounded-full bg-orange-500 mr-3 animate-pulse"></span>
                PREPARING
              </h3>
              <span className="bg-white text-orange-600 px-3 py-1 rounded-lg text-sm font-bold border border-orange-200 shadow-sm">{preparingCourses.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar pr-2">
              {preparingCourses.map(course => <CourseCard key={course.id} course={course} />)}
              {preparingCourses.length === 0 && <div className="text-center text-orange-400 mt-10 italic text-sm">Nothing currently cooking</div>}
            </div>
          </div>

          {/* Column 3: Ready */}
          <div className="bg-green-50/50 rounded-xl p-4 flex flex-col h-full border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-700 flex items-center text-lg">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-3"></span>
                READY TO SERVE
              </h3>
              <span className="bg-white text-green-600 px-3 py-1 rounded-lg text-sm font-bold border border-green-200 shadow-sm">{readyCourses.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar pr-2">
              {readyCourses.map(course => <CourseCard key={course.id} course={course} />)}
              {readyCourses.length === 0 && <div className="text-center text-green-400 mt-10 italic text-sm">No courses ready</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
