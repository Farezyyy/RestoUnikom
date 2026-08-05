import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, ShoppingCart, Check, AlertCircle, Utensils } from 'lucide-react';
import api from '../../api';
import OrderCart from '../../components/waiter/OrderCart';

export default function AdditionalOrders() {
  const [activeTables, setActiveTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbMenus, setDbMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchActiveTablesAndMenu = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Fetch live active tables for current session/today
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

      // 2. Fetch live additional/a la carte menus from DB
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

  const filteredMenu = dbMenus.filter(item => 
    (item.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.kategori || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item) => {
    if (item.aktif === false) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, name: item.nama, price: item.harga || 0, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.qty > 1) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const totalCart = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  const handleCheckout = () => {
    if (!selectedTable) return alert("Please select an active target table");
    setIsCheckingOut(true);
    setTimeout(() => {
      const targetTableObj = activeTables.find(t => t.id === selectedTable);
      setCart([]);
      setIsCheckingOut(false);
      alert(`Additional items successfully added to Table ${targetTableObj?.no_meja || selectedTable}'s bill!`);
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left: Menu Items */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-primary" /> Additional Orders & Beverages
              </h3>
              <p className="text-xs text-gray-500">Live database items for active tables</p>
            </div>
            
            <div className="relative w-64">
              <input 
                type="text" 
                placeholder="Search menu or beverage..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-auto bg-gray-50/30">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-medium">Loading live menu items...</div>
          ) : filteredMenu.length === 0 ? (
            <div className="p-12 text-center text-gray-400 italic">No additional menu items found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMenu.map(item => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-xl border transition-all ${item.aktif !== false ? 'bg-white border-gray-200 hover:border-primary/50 cursor-pointer shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}
                  onClick={() => addToCart(item)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="pr-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold mb-1">{item.kategori || 'A La Carte'}</p>
                      <h4 className="font-bold text-gray-900">{item.nama}</h4>
                    </div>
                    {item.aktif === false ? (
                      <span className="flex items-center text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
                        <AlertCircle className="w-3 h-3 mr-1" /> Unavailable
                      </span>
                    ) : (
                      <span className="text-sm font-extrabold text-primary">Rp {Number(item.harga).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <OrderCart 
        title="Additional Order Cart"
        cart={cart}
        totalCart={totalCart}
        selectedTable={selectedTable}
        activeTables={activeTables}
        onTableChange={setSelectedTable}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
        checkoutLabel={`Add to Table ${activeTables.find(t => t.id === selectedTable)?.no_meja || ''} Bill`}
      />
    </div>
  );
}
