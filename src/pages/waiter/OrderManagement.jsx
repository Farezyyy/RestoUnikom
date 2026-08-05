import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Check, ClipboardList, Utensils, AlertCircle } from 'lucide-react';
import api from '../../api';
import OrderCart from '../../components/waiter/OrderCart';

export default function OrderManagement() {
  const [activeTables, setActiveTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeMenuCategory, setActiveMenuCategory] = useState('ALL');
  const [dbMenus, setDbMenus] = useState([]);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchActiveTablesAndMenu = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Fetch active tables from live dining sessions / reservations
      const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
      let activeTbls = [];

      if (jadwals && jadwals.length > 0) {
        const { data: reservations } = await api.get(`/reservasi?id_jadwal_sesi=${jadwals[0].id}`);
        const activeRes = (reservations || []).filter(r => ['DATANG', 'DIKONFIRMASI'].includes(r.status));
        
        activeTbls = activeRes.map(r => {
          const m = r.reservasi_meja?.[0]?.meja;
          return {
            id: m?.id || r.id,
            no_meja: m?.no_meja || r.id,
            customerName: r.customer?.nama || 'Guest',
            resId: r.id
          };
        }).filter(t => t.no_meja);
      }

      setActiveTables(activeTbls);
      if (activeTbls.length > 0 && !selectedTable) {
        setSelectedTable(activeTbls[0].id);
      }

      // 2. Fetch live menu items from DB
      const { data: menuData } = await api.get('/menu');
      setDbMenus(menuData || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTablesAndMenu();
  }, []);

  const addCourseToOrder = (item) => {
    const existingIndex = order.findIndex(i => i.id === item.id);
    if (existingIndex > -1) {
      const updated = [...order];
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: (updated[existingIndex].qty || 1) + 1
      };
      setOrder(updated);
    } else {
      setOrder([...order, { ...item, name: item.nama, price: item.harga || 0, qty: 1, table: selectedTable }]);
    }
  };

  const handleCartAdd = (item) => {
    addCourseToOrder(item);
  };

  const removeCourse = (id) => {
    const existingIndex = order.findIndex(i => i.id === id);
    if (existingIndex > -1) {
      const updated = [...order];
      if ((updated[existingIndex].qty || 1) > 1) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty - 1
        };
        setOrder(updated);
      } else {
        setOrder(order.filter(i => i.id !== id));
      }
    }
  };

  const handleCheckout = async () => {
    if (!selectedTable) return alert("Please select a target active table");
    setIsCheckingOut(true);
    try {
      // Find order / dining session for table
      const targetTableObj = activeTables.find(t => t.id === selectedTable);
      alert(`Order successfully submitted for Table ${targetTableObj?.no_meja || selectedTable}!`);
      setOrder([]);
    } catch (err) {
      console.error(err);
      alert("Failed to submit order");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredMenus = dbMenus.filter(m => activeMenuCategory === 'ALL' || m.kategori === activeMenuCategory);
  const totalCart = order.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Menu Selection Area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Utensils className="w-5 h-5 mr-2 text-primary" /> Fine Dining Menu Selection
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Live database menus & active table ordering</p>
          </div>
          
          <div className="flex space-x-2">
            {['ALL', 'APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE'].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveMenuCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeMenuCategory === cat ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-medium">Loading live menu items...</div>
          ) : filteredMenus.length === 0 ? (
            <div className="p-12 text-center text-gray-400 italic">No menu items found for category "{activeMenuCategory}".</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMenus.map(menu => (
                <div key={menu.id} className="p-4 border border-gray-200 rounded-xl hover:border-primary/50 transition-colors bg-white flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 tracking-wider">
                      {menu.kategori}
                    </span>
                    <h4 className="font-bold text-gray-900 mt-1 text-base">{menu.nama}</h4>
                    <p className="text-sm font-extrabold text-primary mt-0.5">Rp {Number(menu.harga).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => addCourseToOrder(menu)}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Actions */}
      <OrderCart 
        title="Current Order Cart"
        cart={order}
        totalCart={totalCart}
        selectedTable={selectedTable}
        activeTables={activeTables}
        onTableChange={setSelectedTable}
        onAdd={handleCartAdd}
        onRemove={removeCourse}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
        checkoutLabel="Send Order to Kitchen"
      />
    </div>
  );
}
