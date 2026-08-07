import React, { useState, useEffect } from 'react';
import api from '../../api';
import { classifyDailySets } from '../../data/useWeeklyMenu';

export default function ReservationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', phone: '', date: '', guests: 1 });
  const [dailySets, setDailySets] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [menuLoading, setMenuLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tablesLoading, setTablesLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Load the day's set menus (A/B) whenever the chosen date changes.
  useEffect(() => {
    if (!formData.date) {
      setDailySets([]);
      setSelectedMenu('');
      return;
    }
    let alive = true;
    setMenuLoading(true);
    (async () => {
      try {
        const { data } = await api.get(`/menu-harian?tanggal=${formData.date}`);
        if (!alive) return;
        const sets = classifyDailySets(data || []);
        setDailySets(sets);
        // Reset selection if it's no longer valid for the new date.
        setSelectedMenu(prev => (sets.some(s => s.value === prev) ? prev : ''));
      } catch (err) {
        if (!alive) return;
        console.error('Failed to load daily menu', err);
        setDailySets([]);
        setSelectedMenu('');
      } finally {
        if (alive) setMenuLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [formData.date]);

  // Load the dining sessions available for the chosen date.
  useEffect(() => {
    if (!formData.date) {
      setSessions([]);
      setSelectedSession('');
      return;
    }
    let alive = true;
    setSessionsLoading(true);
    (async () => {
      try {
        const { data } = await api.get(`/jadwal-sesi?tanggal=${formData.date}&status=true`);
        if (!alive) return;
        setSessions(data || []);
        setSelectedSession('');
      } catch (err) {
        if (!alive) return;
        console.error('Failed to load sessions', err);
        setSessions([]);
        setSelectedSession('');
      } finally {
        if (alive) setSessionsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [formData.date]);

  // Load tables for the chosen session, flagging which ones are already full.
  useEffect(() => {
    if (!selectedSession) {
      setTables([]);
      setSelectedTable('');
      return;
    }
    let alive = true;
    setTablesLoading(true);
    (async () => {
      try {
        const [allRes, availRes] = await Promise.all([
          api.get('/meja?aktif=true'),
          api.get(`/meja/available?id_jadwal_sesi=${selectedSession}`),
        ]);
        if (!alive) return;
        const availableIds = new Set((availRes.data || []).map(t => t.id));
        const merged = (allRes.data || []).map(t => ({ ...t, booked: !availableIds.has(t.id) }));
        setTables(merged);
        setSelectedTable('');
      } catch (err) {
        if (!alive) return;
        console.error('Failed to load tables', err);
        setTables([]);
        setSelectedTable('');
      } finally {
        if (alive) setTablesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedSession]);

  const handleReservation = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      alert("Please select a dining session.");
      return;
    }
    if (!selectedMenu) {
      alert("Please select a menu (Menu A or Menu B) for your reservation date.");
      return;
    }
    if (!selectedTable) {
      alert("Please select an available table.");
      return;
    }
    try {
      // Post to the backend with the chosen session, menu, and table.
      const { data } = await api.post('/reservasi', {
        nama: formData.name,
        no_telp: formData.phone,
        jumlah_tamu: parseInt(formData.guests),
        id_jadwal_sesi: parseInt(selectedSession),
        id_meja: parseInt(selectedTable),
        pilihan_menu: selectedMenu,
      });

      // The QR token is the guest's check-in code. Backend returns reservasi_qr as an array.
      const qrToken = data.reservasi_qr?.[0]?.token || data.reservasi_qr?.token;
      setConfirmation({ id: data.id, name: formData.name, menu: selectedMenu, token: qrToken });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit reservation.");
    }
  };

  const handleClose = () => {
    setConfirmation(null);
    setFormData({ name: '', phone: '', date: '', guests: 1 });
    setSelectedMenu('');
    setDailySets([]);
    setSessions([]);
    setSelectedSession('');
    setTables([]);
    setSelectedTable('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={confirmation ? handleClose : onClose}
      ></div>

      {/* Modal Content */}
      <div className="glass-dark relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-8 md:p-10 border border-accent/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300">
        <button
          onClick={confirmation ? handleClose : onClose}
          className="absolute top-6 right-6 text-cream/50 hover:text-accent text-2xl transition-colors"
        >
          &times;
        </button>

        {confirmation ? (
          // QR Code Success Panel
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-serif text-accent mb-2">Reservation Confirmed</h3>
              <p className="text-cream/60 text-sm">Your table has been reserved, {confirmation.name}!</p>
            </div>

            <div className="bg-white/5 border border-accent/30 rounded-xl p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-cream/50 uppercase tracking-widest">Your Check-in QR Code</p>
                <p className="text-2xl font-mono text-accent font-bold break-all leading-relaxed">{confirmation.token || 'N/A'}</p>
              </div>
              <div className="pt-4 border-t border-white/10 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-cream/50">Reservation ID:</span>
                  <span className="text-cream font-medium">RES-{confirmation.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cream/50">Selected Menu:</span>
                  <span className="text-cream font-medium">{confirmation.menu}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-left">
              <p className="text-xs text-blue-300/90 leading-relaxed">
                Please save this QR code. Present it to our staff when you arrive at the restaurant to check in.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-accent text-dark rounded hover:bg-accent/90 transition-colors duration-300 font-medium tracking-widest uppercase shadow-lg"
            >
              Close
            </button>
          </div>
        ) : (
          // Reservation Form
          <>
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
            <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Dining Session</label>
            {!formData.date ? (
              <p className="text-xs text-cream/40 italic py-3">Select a date first to see available sessions.</p>
            ) : sessionsLoading ? (
              <p className="text-xs text-cream/40 italic py-3">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-cream/40 italic py-3">No dining sessions available for this date.</p>
            ) : (
              <select
                required
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent text-cream transition-colors appearance-none"
              >
                <option value="" className="bg-dark text-cream">-- Select Session --</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id} className="bg-dark text-cream">
                    {s.sesi_makan?.nama} ({s.sesi_makan?.waktu_mulai} - {s.sesi_makan?.waktu_selesai})
                  </option>
                ))}
              </select>
            )}
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

          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Choose Your Table</label>
            {!selectedSession ? (
              <p className="text-xs text-cream/40 italic py-3">Select a session first to see available tables.</p>
            ) : tablesLoading ? (
              <p className="text-xs text-cream/40 italic py-3">Loading tables...</p>
            ) : tables.length === 0 ? (
              <p className="text-xs text-cream/40 italic py-3">No tables found for this session.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2 -mr-2">
                <div className="grid grid-cols-2 gap-3">
                  {tables.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => !t.booked && setSelectedTable(t.id)}
                      disabled={t.booked}
                      className={`text-left px-4 py-3 rounded border transition-all ${
                        t.booked
                          ? 'border-red-500/30 bg-red-500/5 text-red-400/50 cursor-not-allowed'
                          : selectedTable === t.id
                          ? 'border-accent bg-accent/10 text-cream shadow-[0_0_15px_rgba(154,59,59,0.3)]'
                          : 'border-white/10 bg-white/5 text-cream/70 hover:border-accent/50'
                      }`}
                    >
                      <span className="block text-sm font-medium">Table {t.no_meja}</span>
                      <span className="block text-xs mt-0.5">
                        {t.booked ? 'Full' : `Capacity: ${t.kapasitas}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1 tracking-wider uppercase">Choose Your Set Menu</label>
            {!formData.date ? (
              <p className="text-xs text-cream/40 italic py-3">Select a date first to see available menus.</p>
            ) : menuLoading ? (
              <p className="text-xs text-cream/40 italic py-3">Loading menus for this date...</p>
            ) : dailySets.length === 0 ? (
              <p className="text-xs text-cream/40 italic py-3">No set menu available for this date yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dailySets.map(s => (
                  <button
                    type="button"
                    key={s.value}
                    onClick={() => setSelectedMenu(s.value)}
                    className={`text-left px-4 py-3 rounded border transition-all ${
                      selectedMenu === s.value
                        ? 'border-accent bg-accent/10 text-cream shadow-[0_0_15px_rgba(154,59,59,0.3)]'
                        : 'border-white/10 bg-white/5 text-cream/70 hover:border-accent/50'
                    }`}
                  >
                    <span className="block text-sm font-medium">{s.value}</span>
                    <span className="block text-xs text-cream/50 mt-0.5">{s.label.replace(`${s.value} · `, '')}</span>
                  </button>
                ))}
              </div>
            )}
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
          </>
        )}
      </div>
    </div>
  );
}
