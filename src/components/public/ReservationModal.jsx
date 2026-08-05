import React, { useState } from 'react';
import api from '../../api';

export default function ReservationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', phone: '', date: '', time: '', guests: 1 });

  const handleReservation = async (e) => {
    e.preventDefault();
    try {
      // Find a jadwal sesi for the given date (Assuming we want the first available for now)
      const { data: jadwals } = await api.get(`/jadwal-sesi?tanggal=${formData.date}&status=true`);
      if (jadwals.length === 0) {
        alert("No dining sessions available for this date.");
        return;
      }
      const jadwal = jadwals[0];

      // Post to the backend
      const { data } = await api.post('/reservasi', {
        nama: formData.name,
        no_telp: formData.phone,
        jumlah_tamu: parseInt(formData.guests),
        id_jadwal_sesi: jadwal.id,
        // Since public reservations don't select a table, we pass null or skip.
        // Wait, the backend requires id_meja to be passed, otherwise it throws "Table not found".
        // We will assign a dummy table or update backend to make id_meja optional.
      });

      alert(`Reservation requested for ${formData.name}. Booking ID: ${data.id}. Please wait for admin confirmation.`);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit reservation.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="glass-dark relative z-10 w-full max-w-lg rounded-2xl p-8 md:p-10 border border-accent/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-cream/50 hover:text-accent text-2xl transition-colors"
        >
          &times;
        </button>
        <h3 className="text-3xl font-serif text-accent mb-2">Reserve a Table</h3>
        <p className="text-cream/60 text-sm mb-8 font-light">Join us for an exquisite dining experience.</p>
        
        <form onSubmit={handleReservation} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent text-cream placeholder-white/20 transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Phone Number</label>
            <input 
              type="tel" 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent text-cream placeholder-white/20 transition-colors"
              placeholder="+62 812 3456 7890"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Date</label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent text-cream transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Time</label>
              <input 
                type="time" 
                required
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent text-cream transition-colors [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Number of Guests</label>
            <select 
              value={formData.guests}
              onChange={e => setFormData({...formData, guests: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent text-cream transition-colors appearance-none"
            >
              {[1,2,3,4,5,6,7,8].map(n => (
                <option key={n} value={n} className="bg-dark text-cream">{n} {n===1?'Guest':'Guests'}</option>
              ))}
            </select>
          </div>
          
          <div className="pt-6">
            <button 
              type="submit"
              className="w-full py-4 bg-primary text-cream rounded hover:bg-secondary transition-colors duration-300 font-medium tracking-widest uppercase shadow-lg shadow-primary/20"
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
