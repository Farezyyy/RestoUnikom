import React, { useState, useEffect } from 'react';
import api from '../../api';
import { classifyDailySets } from '../../data/useWeeklyMenu';

export default function WalkInModal({ isOpen, onClose, activeJadwal, onCheckInComplete }) {
  const [formData, setFormData] = useState({ name: '', phone: '', guests: 1, selectedTable: '', selectedMenu: '' });
  const [availableTables, setAvailableTables] = useState([]);
  const [dailySets, setDailySets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeJadwal) {
      // Fetch available tables for this session
      const fetchTables = async () => {
        try {
          const { data } = await api.get(`/meja/available?id_jadwal_sesi=${activeJadwal.id}`);
          setAvailableTables(data);
          if (data.length > 0) {
             setFormData(prev => ({ ...prev, selectedTable: data[0].id }));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchTables();

      // Fetch the day's set menus (A/B) for this session's date
      const fetchMenus = async () => {
        if (!activeJadwal.tanggal) { setDailySets([]); return; }
        try {
          const { data } = await api.get(`/menu-harian?tanggal=${activeJadwal.tanggal}`);
          setDailySets(classifyDailySets(data || []));
        } catch (err) {
          console.error(err);
          setDailySets([]);
        }
      };
      fetchMenus();
    }
  }, [isOpen, activeJadwal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeJadwal) return alert("No active session.");
    if (!formData.selectedTable) return alert("Please select a table.");

    setLoading(true);
    try {
      // 1. Create Reservation (Status DATANG for Walk-in)
      const resPayload = {
        nama: formData.name,
        no_telp: formData.phone,
        jumlah_tamu: parseInt(formData.guests),
        id_jadwal_sesi: activeJadwal.id,
        id_meja: parseInt(formData.selectedTable),
        pilihan_menu: formData.selectedMenu || null,
        status: 'DATANG'
      };
      
      const { data: reservation } = await api.post('/reservasi', resPayload);

      // 2. We can automatically check-in or rely on QR. For a walk-in, the waiter typically starts the session directly.
      // The backend /reservasi creates it, but we also need a dining session.
      // We can generate a token or bypass if the backend allows creating dining session directly.
      // Actually, wait, let's just create the dining session using checkin endpoint.
      // To do checkin, we need the check_in_token from the reservation.
      
      // Let's get the created reservation details to get the token
      const { data: newRes } = await api.get(`/reservasi`);
      const createdRes = newRes.find(r => r.id === reservation.id);
      
      if (createdRes && createdRes.check_in_token) {
         await api.post(`/dining-session/checkin/${createdRes.check_in_token}`);
      } else {
         alert("Reservation created, but failed to auto check-in.");
      }

      alert(`Walk-in successful for ${formData.name}. Table assigned.`);
      onCheckInComplete();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit walk-in.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-900 relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-2xl font-serif text-gray-800 dark:text-gray-100 mb-2">New Walk-In</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Create a reservation and seat guests immediately for the active session.</p>

        {!activeJadwal ? (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400 rounded-lg text-sm">
             No active session right now. Cannot accept walk-ins.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Name</label>
                 <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg focus:border-primary focus:outline-none text-sm" placeholder="Guest Name"/>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Phone</label>
                 <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg focus:border-primary focus:outline-none text-sm" placeholder="Phone"/>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Session</label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                   {activeJadwal.sesi_makan?.nama}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Guests</label>
                <input type="number" min="1" max="10" required value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:border-primary focus:outline-none text-sm"/>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Assign Table</label>
              {availableTables.length === 0 ? (
                 <p className="text-sm text-red-500 dark:text-red-400">No tables available for this session.</p>
              ) : (
                <select
                  required
                  value={formData.selectedTable}
                  onChange={e => setFormData({...formData, selectedTable: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:border-primary focus:outline-none text-sm"
                >
                  {availableTables.map(t => (
                    <option key={t.id} value={t.id}>Table {t.no_meja} (Cap: {t.kapasitas})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Menu Selection</label>
              {dailySets.length === 0 ? (
                 <p className="text-sm text-gray-400 dark:text-gray-500 italic">No set menu configured for this date.</p>
              ) : (
                <select
                  value={formData.selectedMenu}
                  onChange={e => setFormData({...formData, selectedMenu: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:border-primary focus:outline-none text-sm"
                >
                  <option value="">No menu selected</option>
                  {dailySets.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
               <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
               <button type="submit" disabled={loading || availableTables.length === 0} className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-secondary disabled:opacity-50">
                 {loading ? 'Processing...' : 'Seat Guests'}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
