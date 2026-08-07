import React, { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, Utensils, RefreshCw, AlertCircle, User, Users } from 'lucide-react';
import api from '../../api';
import { supabase } from '../../supabaseClient';

export default function ServiceWorkflow() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveServices = async () => {
    try {
      // 1. Get active dining sessions (guests currently seated)
      const { data: dsData } = await api.get('/dining-session?status=BERJALAN');
      const dsIds = (dsData || []).map(ds => ds.id);

      if (dsIds.length === 0) {
        setServices([]);
        return;
      }

      // 2. Get active orders
      const { data: allOrders } = await api.get('/orders');
      const activeOrders = (allOrders || []).filter(o => dsIds.includes(o.id_dining_session));

      // 3. Map active order courses
      const mapped = activeOrders.flatMap(order => {
        const ds = dsData.find(d => d.id === order.id_dining_session);
        const tableNo = ds?.reservasi?.reservasi_meja?.[0]?.meja?.no_meja || 'N/A';
        const customerName = ds?.reservasi?.customer?.nama || `Table ${tableNo}`;
        const totalGuests = ds?.reservasi?.jumlah_tamu || 1;
        const pilihanMenu = ds?.reservasi?.pilihan_menu || 'Set Menu A';

        return (order.order_course || []).map(courseItem => ({
          courseId: courseItem.id,
          orderId: order.id,
          tableNo: tableNo,
          customerName: customerName,
          totalGuests: totalGuests,
          pilihanMenu: pilihanMenu,
          course: courseItem.course,
          status: courseItem.status, // MENUNGGU, DIMASAK, SIAP, DISAJIKAN
          menuName: courseItem.menu?.nama || `Item ${courseItem.course}`,
          qty: courseItem.qty || 1
        }));
      });

      setServices(mapped);
    } catch (err) {
      console.error("Failed to fetch active services", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveServices();

    // Supabase Realtime subscription for instant dish serving updates
    const channel = supabase
      .channel('service_workflow_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_course' }, fetchActiveServices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchActiveServices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dining_session' }, fetchActiveServices)
      .subscribe();

    const interval = setInterval(fetchActiveServices, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const markAsServed = async (courseId) => {
    try {
      await api.patch(`/orders/courses/${courseId}`, { status: 'DISAJIKAN' });
      fetchActiveServices();
    } catch (err) {
      console.error("Failed to update course status", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Active Service Workflow</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time dish tracking & serving lifecycle from Kitchen to Table</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <div className="flex items-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/40 px-2.5 py-1 rounded-md border border-orange-200 dark:border-orange-800">
            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span> Dimasak (Cooking)
          </div>
          <div className="flex items-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span> Siap Disajikan (Ready)
          </div>
          <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Tersaji (Served)
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary dark:text-accent" />
          Loading active service data...
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <Utensils className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Active Service In Progress</h3>
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 max-w-md mx-auto">
            When guests check-in and orders are created, active dish stages will appear here automatically for waiters to serve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.courseId} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
              <div className={`p-4 border-b flex justify-between items-center ${
                service.status === 'SIAP' ? 'bg-blue-50/70 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800' :
                service.status === 'DIMASAK' ? 'bg-orange-50/70 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800' :
                service.status === 'DISAJIKAN' ? 'bg-green-50/70 dark:bg-green-900/30 border-green-100 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${
                    service.status === 'SIAP' ? 'bg-blue-600' : 
                    service.status === 'DIMASAK' ? 'bg-orange-500' : 
                    service.status === 'DISAJIKAN' ? 'bg-green-600' : 'bg-gray-400'
                  }`}>
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Meja {service.tableNo}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold flex items-center mt-0.5">
                      <User className="w-3.5 h-3.5 mr-1 text-primary dark:text-accent" />
                      {service.customerName}
                    </p>
                  </div>
                </div>
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    service.status === 'SIAP' ? 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800' :
                    service.status === 'DIMASAK' ? 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800' :
                    service.status === 'DISAJIKAN' ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {service.status === 'SIAP' ? 'SIAP DISAJIKAN' : service.status}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* Detailed Info Box from DB */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 mb-3 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 font-semibold">
                      <span className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                        Total Guests: <strong className="text-gray-900 dark:text-gray-100 ml-1">{service.totalGuests} Pax</strong>
                      </span>
                      <span className="bg-primary/10 text-primary dark:text-accent px-2 py-0.5 rounded font-bold flex items-center">
                        <Utensils className="w-3 h-3 mr-1" />
                        {service.pilihanMenu}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest block mb-1">Fase Course</span>
                  <p className="text-base font-bold text-primary dark:text-accent">{service.course}</p>
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex justify-between">
                      <span>{service.menuName}</span>
                      <span className="text-gray-500 dark:text-gray-400">x{service.qty}</span>
                    </p>
                  </div>
                </div>

                <div>
                  {service.status === 'SIAP' && (
                    <button 
                      onClick={() => markAsServed(service.courseId)}
                      className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-green-600/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tandai Disajikan (Mark DISAJIKAN)</span>
                    </button>
                  )}
                  {service.status === 'DISAJIKAN' && (
                    <div className="w-full py-2 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span>Hidangan Sudah Disajikan</span>
                    </div>
                  )}
                  {service.status === 'DIMASAK' && (
                    <div className="w-full py-2 bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 border border-orange-200 dark:border-orange-800">
                      <ChefHat className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 animate-pulse" />
                      <span>Sedang Dimasak Koki di Dapur...</span>
                    </div>
                  )}
                  {service.status === 'MENUNGGU' && (
                    <div className="w-full py-2 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border border-gray-200 dark:border-gray-700">
                      <AlertCircle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400" />
                      <span>Menunggu Antrean Dapur</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
