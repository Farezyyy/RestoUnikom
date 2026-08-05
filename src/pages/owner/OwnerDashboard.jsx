import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { Users, ShieldAlert, Trash2, Power, Edit3, Grid, Plus, X } from 'lucide-react';
import FloorPlan, { statusIndicators } from '../../components/waiter/FloorPlan';
import { mapDBTableToVisual } from '../../utils/tableCoordinates';
import api from '../../api';

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('floor'); // floor, workers, menu, storage
  
  // Floor Plan State
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  // Workers State
  const [workers, setWorkers] = useState([]);
  const [newWorker, setNewWorker] = useState({ nama: '', email: '', password: '', role: 'PELAYAN' });
  const [editingWorkerId, setEditingWorkerId] = useState(null);

  // CMS State
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [newMenu, setNewMenu] = useState({ nama: '', kategori: 'MAIN', harga: 0, aktif: true });
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ nama: '', unit: '', stok_minimal: 0, stok: 0 });

  // Override State (uses AdminContext)
  const { menuItems, ingredients, toggleMenuManualStatus, updateIngredientStock, loading, fetchData } = useAdminContext();

  const fetchTables = async () => {
    try {
      const { data: dbTables } = await api.get('/meja');

      const today = new Date().toISOString().split('T')[0];
      const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
      const currentJadwal = jadwals.length > 0 ? jadwals[0] : null;

      let activeRes = [];
      let activeDS = [];

      if (currentJadwal) {
        try {
          const { data: allRes } = await api.get(`/reservasi?id_jadwal_sesi=${currentJadwal.id}`);
          if (Array.isArray(allRes)) {
            activeRes = allRes.filter(r => ['MENUNGGU', 'DATANG', 'DIKONFIRMASI'].includes(r.status));
          }
        } catch (e) {}

        try {
          const { data: dsData } = await api.get('/dining-session?status=BERJALAN');
          if (Array.isArray(dsData)) activeDS = dsData;
        } catch (e) {}
      }

      const visualTables = (dbTables || []).map(dbT => {
        let status = dbT.aktif === false ? 'disabled' : 'available';
        let customer = null;

        if (dbT.aktif !== false && currentJadwal) {
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
          dbStatus: dbT.aktif ? 'ACTIVE' : 'INACTIVE'
        };
      });

      setTables(visualTables);
      if (selectedTable) {
        const updatedSelected = visualTables.find(t => t.id === selectedTable.id);
        if (updatedSelected) setSelectedTable(updatedSelected);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get('/users');
      setWorkers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchTables();
    const interval = setInterval(fetchTables, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newWorker);
      setNewWorker({ nama: '', email: '', password: '', role: 'PELAYAN' });
      fetchWorkers();
    } catch (err) {
      console.error(err);
      alert("Error adding worker");
    }
  };

  const handleEditWorkerRole = async (id, newRole) => {
    try {
      const worker = workers.find(w => w.id === id);
      await api.patch(`/users/${id}`, { nama: worker?.nama, email: worker?.email, role: newRole });
      setEditingWorkerId(null);
      fetchWorkers();
    } catch (err) { console.error(err); }
  };

  const handleDeleteWorker = async (id) => {
    if(!window.confirm("Are you sure you want to delete this worker?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchWorkers();
    } catch (err) { console.error(err); }
  };

  const handleTableStatusChange = async (newStatus) => {
    if (!selectedTable) return;
    const tableId = selectedTable.id;

    // Map newStatus string to target visual status key
    let targetStatus = 'available';
    if (newStatus === 'NONAKTIF' || newStatus === 'disabled') targetStatus = 'disabled';
    else if (newStatus === 'KOSONG' || newStatus === 'available') targetStatus = 'available';
    else if (newStatus === 'RESERVASI' || newStatus === 'reserved') targetStatus = 'reserved';
    else if (newStatus === 'TERISI' || newStatus === 'occupied') targetStatus = 'occupied';

    // 1. INSTANT OPTIMISTIC UI UPDATE (0ms Delay)
    const updatedTables = tables.map(t => t.id === tableId ? { ...t, status: targetStatus, dbStatus: targetStatus === 'disabled' ? 'INACTIVE' : 'ACTIVE' } : t);
    setTables(updatedTables);
    setSelectedTable(prev => prev ? { ...prev, status: targetStatus, dbStatus: targetStatus === 'disabled' ? 'INACTIVE' : 'ACTIVE' } : null);

    try {
      if (targetStatus === 'disabled') {
        await api.patch(`/meja/${tableId}`, { aktif: false });
      } else if (targetStatus === 'available') {
        await api.patch(`/meja/${tableId}`, { aktif: true });

        // Clean up active reservations and dining sessions for this table
        const today = new Date().toISOString().split('T')[0];
        const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
        if (jadwals && jadwals.length > 0) {
          const { data: allRes } = await api.get(`/reservasi?id_jadwal_sesi=${jadwals[0].id}`);
          const activeRes = (allRes || []).filter(r => r.reservasi_meja?.some(rm => (rm?.meja?.id === tableId) || (rm?.id_meja === tableId)) && ['MENUNGGU', 'DATANG', 'DIKONFIRMASI'].includes(r.status));
          
          for (const res of activeRes) {
            await api.patch(`/reservasi/${res.id}/status`, { status: 'SELESAI' });
          }

          const { data: dsData } = await api.get('/dining-session?status=BERJALAN');
          const activeDS = (dsData || []).filter(ds => activeRes.some(r => r.id === ds.id_reservasi));
          for (const ds of activeDS) {
            await api.patch(`/dining-session/${ds.id}/end`);
          }
        }
      } else if (targetStatus === 'reserved') {
        await api.patch(`/meja/${tableId}`, { aktif: true });
        const today = new Date().toISOString().split('T')[0];
        const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
        if (jadwals && jadwals.length > 0) {
          await api.post('/reservasi', {
            id_jadwal_sesi: jadwals[0].id,
            id_meja: tableId,
            jumlah_tamu: 2,
            nama: "Reserved Guest",
            no_telp: `0812345${tableId}`
          });
        }
      } else if (targetStatus === 'occupied') {
        await api.patch(`/meja/${tableId}`, { aktif: true });
        const today = new Date().toISOString().split('T')[0];
        const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${today}&status=true`);
        if (jadwals && jadwals.length > 0) {
          const { data: res } = await api.post('/reservasi', {
            id_jadwal_sesi: jadwals[0].id,
            id_meja: tableId,
            jumlah_tamu: 2,
            nama: "Seated Guest",
            no_telp: `0898765${tableId}`
          });
          if (res?.id) {
            await api.post('/dining-session', { id_reservasi: res.id });
          }
        }
      }
      fetchTables();
    } catch (err) {
      console.error(err);
      fetchTables();
    }
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    try {
      await api.post('/menu', {
        nama: newMenu.nama,
        kategori: newMenu.kategori,
        harga: Number(newMenu.harga),
        aktif: newMenu.aktif
      });
      setShowMenuModal(false);
      setNewMenu({ nama: '', kategori: 'MAIN', harga: 0, aktif: true });
      fetchData(); // Refresh context
    } catch (err) { console.error(err); alert("Error"); }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bahan', {
        nama: newIngredient.nama,
        unit: newIngredient.unit,
        stok_minimal: Number(newIngredient.stok_minimal),
        stok: Number(newIngredient.stok)
      });
      setShowIngredientModal(false);
      setNewIngredient({ nama: '', unit: '', stok_minimal: 0, stok: 0 });
      fetchData(); // Refresh context
    } catch (err) { console.error(err); alert("Error"); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('floor')}
          className={`px-6 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'floor' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Grid className="w-5 h-5" /> Floor Plan Control
        </button>
        <button 
          onClick={() => setActiveTab('workers')}
          className={`px-6 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'workers' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Users className="w-5 h-5" /> Worker Management
        </button>
        <button 
          onClick={() => setActiveTab('cms')}
          className={`px-6 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'cms' ? 'bg-red-50 text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <ShieldAlert className="w-5 h-5" /> Database CMS (Override)
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/30">
        
        {/* FLOOR PLAN TAB */}
        {activeTab === 'floor' && (
          <div className="flex flex-col lg:flex-row h-full">
            <div className="flex-1 p-4 bg-gray-100 overflow-auto flex items-center justify-center border-r border-gray-200 relative">
              <FloorPlan tables={tables} onSelectTable={setSelectedTable} />
            </div>
            <div className="w-full lg:w-80 bg-white p-6 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Table Control</h3>
              {selectedTable ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-3xl font-bold text-gray-900">{selectedTable.label}</h4>
                    <p className="text-sm text-gray-500 capitalize flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${statusIndicators[selectedTable.status]}`}></span> 
                       {selectedTable.status} (DB: {selectedTable.dbStatus})
                    </p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Change Status</p>
                     <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => handleTableStatusChange('KOSONG')} className="p-2 border rounded hover:bg-green-50 text-green-700 font-medium text-sm">Available</button>
                       <button onClick={() => handleTableStatusChange('TERISI')} className="p-2 border rounded hover:bg-red-50 text-red-700 font-medium text-sm">Occupied</button>
                       <button onClick={() => handleTableStatusChange('RESERVASI')} className="p-2 border rounded hover:bg-blue-50 text-blue-700 font-medium text-sm">Reserved</button>
                       <button onClick={() => handleTableStatusChange('NONAKTIF')} className="p-2 border rounded hover:bg-gray-100 text-gray-700 font-medium text-sm">Disable Table</button>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      onClick={async () => {
                        const guest = window.prompt("Enter Guest Name for Manual Reservation:");
                        if(guest && selectedTable) {
                          const { error } = await supabase.from('meja').update({ status: 'RESERVASI' }).eq('id', selectedTable.id);
                          if(!error) fetchTables();
                          // In a full implementation, this would also insert into public.reservasi
                          alert(`Manual reservation for ${guest} placed on ${selectedTable.label}.`);
                        }
                      }}
                      className="w-full py-2 bg-primary text-white rounded font-medium hover:bg-secondary">
                      + Manual Reservation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 mt-10">Select a table to control it.</div>
              )}
            </div>
          </div>
        )}

        {/* WORKER MANAGEMENT TAB */}
        {activeTab === 'workers' && (
          <div className="p-6 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Worker</h3>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input type="text" required value={newWorker.nama} onChange={e => setNewWorker({...newWorker, nama: e.target.value})} className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" required value={newWorker.email} onChange={e => setNewWorker({...newWorker, email: e.target.value})} className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input type="password" required value={newWorker.password} onChange={e => setNewWorker({...newWorker, password: e.target.value})} className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value})} className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:outline-none">
                    <option value="PELAYAN">PELAYAN</option>
                    <option value="KOKI">KOKI</option>
                    <option value="KASIR">KASIR</option>
                    <option value="PEMILIK">PEMILIK</option>
                  </select>
                </div>
                <button type="submit" className="w-full p-2 bg-primary text-white font-medium rounded hover:bg-secondary">Add User</button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(w => (
                    <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{w.nama}</td>
                      <td className="p-4 text-gray-500">{w.email}</td>
                      <td className="p-4">
                        {editingWorkerId === w.id ? (
                          <select 
                            defaultValue={w.role}
                            onChange={(e) => handleEditWorkerRole(w.id, e.target.value)}
                            className="p-1 border rounded text-sm"
                          >
                            <option value="PELAYAN">PELAYAN</option>
                            <option value="KOKI">KOKI</option>
                            <option value="KASIR">KASIR</option>
                            <option value="PEMILIK">PEMILIK</option>
                          </select>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-bold cursor-pointer" onClick={() => setEditingWorkerId(w.id)}>
                            {w.role} ✎
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleDeleteWorker(w.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CMS TAB */}
        {activeTab === 'cms' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            
            {/* Modals for CMS */}
            {showMenuModal && (
              <div className="absolute inset-0 bg-white/90 z-10 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-white border border-gray-200 shadow-xl rounded-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Add New Menu</h3>
                    <button onClick={() => setShowMenuModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                  </div>
                  <form onSubmit={handleAddMenu} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input required type="text" value={newMenu.nama} onChange={e => setNewMenu({...newMenu, nama: e.target.value})} className="w-full p-2 border rounded focus:border-primary focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                      <select value={newMenu.kategori} onChange={e => setNewMenu({...newMenu, kategori: e.target.value})} className="w-full p-2 border rounded focus:border-primary focus:outline-none">
                        <option value="MAIN">Main Course</option>
                        <option value="APPETIZER">Appetizer</option>
                        <option value="DESSERT">Dessert / Beverage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Price (Rp)</label>
                      <input required type="number" value={newMenu.harga} onChange={e => setNewMenu({...newMenu, harga: e.target.value})} className="w-full p-2 border rounded focus:border-primary focus:outline-none"/>
                    </div>
                    <button type="submit" className="w-full p-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Save Menu</button>
                  </form>
                </div>
              </div>
            )}

            {showIngredientModal && (
              <div className="absolute inset-0 bg-white/90 z-10 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-white border border-gray-200 shadow-xl rounded-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Add New Ingredient</h3>
                    <button onClick={() => setShowIngredientModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                  </div>
                  <form onSubmit={handleAddIngredient} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input required type="text" value={newIngredient.nama} onChange={e => setNewIngredient({...newIngredient, nama: e.target.value})} className="w-full p-2 border rounded focus:border-primary focus:outline-none"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Base Unit</label>
                        <input required type="text" placeholder="e.g. gram, pcs" value={newIngredient.unit} onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})} className="w-full p-2 border rounded focus:border-primary focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Min Stock</label>
                        <input required type="number" value={newIngredient.stok_minimal} onChange={e => setNewIngredient({...newIngredient, stok_minimal: e.target.value})} className="w-full p-2 border rounded focus:border-primary focus:outline-none"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Initial Stock</label>
                      <input required type="number" value={newIngredient.stok} onChange={e => setNewIngredient({...newIngredient, stok: e.target.value})} className="w-full p-2 border rounded focus:border-primary focus:outline-none"/>
                    </div>
                    <button type="submit" className="w-full p-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Save Ingredient</button>
                  </form>
                </div>
              </div>
            )}

            {/* Menu Override */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-red-800 flex items-center"><Power className="w-4 h-4 mr-2" /> Menu CMS</h3>
                  <p className="text-xs text-red-600 mt-1">Force toggle status or add new menu</p>
                </div>
                <button onClick={() => setShowMenuModal(true)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center"><Plus className="w-3 h-3 mr-1"/> New</button>
              </div>
              <div className="overflow-y-auto p-4 space-y-2 flex-1">
                {loading ? <p className="text-sm text-gray-400">Loading...</p> : menuItems.map(m => (
                  <div key={m.id} className="flex justify-between items-center p-3 border border-gray-100 rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-500">State: {m.active ? 'Active' : 'Disabled'} • Rp {m.price.toLocaleString('id-ID')}</p>
                    </div>
                    <button 
                      onClick={() => toggleMenuManualStatus(m.id)}
                      className={`px-3 py-1 text-xs font-bold rounded ${m.active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {m.active ? 'DISABLE' : 'ENABLE'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Override */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-red-800 flex items-center"><Edit3 className="w-4 h-4 mr-2" /> Storage CMS</h3>
                  <p className="text-xs text-red-600 mt-1">Force update stock values</p>
                </div>
                <button onClick={() => setShowIngredientModal(true)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center"><Plus className="w-3 h-3 mr-1"/> New</button>
              </div>
              <div className="overflow-y-auto p-4 space-y-2 flex-1">
                {loading ? <p className="text-sm text-gray-400">Loading...</p> : ingredients.map(ing => (
                  <div key={ing.id} className="flex justify-between items-center p-3 border border-gray-100 rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{ing.name}</p>
                      <p className="text-xs text-gray-500">Stock: {ing.stock} {ing.unit}</p>
                    </div>
                    <input 
                      type="number" 
                      defaultValue={ing.stock}
                      onBlur={(e) => {
                        if(e.target.value !== String(ing.stock)) {
                           if(window.confirm(`Force update ${ing.name} stock to ${e.target.value}?`)) {
                             updateIngredientStock(ing.id, e.target.value);
                           } else {
                             e.target.value = ing.stock;
                           }
                        }
                      }}
                      className="w-20 p-1 border border-red-200 rounded text-sm focus:border-red-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
