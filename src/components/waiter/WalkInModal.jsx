import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function WalkInModal({ isOpen, onClose, activeJadwal, onCheckInComplete }) {
  const [formData, setFormData] = useState({ name: '', phone: '', guests: 1, selectedTable: '' });
  const [availableTables, setAvailableTables] = useState([]);
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
      <div className="bg-white relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-gray-100">
        <h3 className="text-2xl font-serif text-gray-800 mb-2">New Walk-In</h3>
        <p className="text-gray-500 text-sm mb-6">Create a reservation and seat guests immediately for the active session.</p>
        
        {!activeJadwal ? (
          <div className="p-4 bg-orange-50 text-orange-800 rounded-lg text-sm">
             No active session right now. Cannot accept walk-ins.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                 <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none text-sm" placeholder="Guest Name"/>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                 <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none text-sm" placeholder="Phone"/>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                <div className="w-full px-3 py-2 border bg-gray-50 rounded-lg text-sm text-gray-700">
                   {activeJadwal.sesi_makan?.nama}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                <input type="number" min="1" max="10" required value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none text-sm"/>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign Table</label>
              {availableTables.length === 0 ? (
                 <p className="text-sm text-red-500">No tables available for this session.</p>
              ) : (
                <select 
                  required
                  value={formData.selectedTable} 
                  onChange={e => setFormData({...formData, selectedTable: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none text-sm"
                >
                  {availableTables.map(t => (
                    <option key={t.id} value={t.id}>Table {t.no_meja} (Cap: {t.kapasitas})</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
               <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
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
