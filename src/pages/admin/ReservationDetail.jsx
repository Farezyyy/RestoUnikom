import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Calendar, MapPin, CheckCircle, XCircle, Info, Edit3, Save, X, Phone, User } from 'lucide-react';
import api from '../../api';

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nama: '',
    no_telp: '',
    jumlah_tamu: '',
    id_meja: '',
    status: ''
  });

  const fetchData = async () => {
    try {
      const { data: resData } = await api.get(`/reservasi/${id}`);
      setReservation(resData);
      setEditData({
        nama: resData.customer?.nama || '',
        no_telp: resData.customer?.no_telp || '',
        jumlah_tamu: resData.jumlah_tamu || 1,
        id_meja: resData.reservasi_meja?.[0]?.id_meja || resData.reservasi_meja?.[0]?.meja?.id || '',
        status: resData.status || 'MENUNGGU'
      });
      
      const { data: allTables } = await api.get('/meja');
      setTables(allTables);
    } catch (err) {
      console.error(err);
      alert("Error fetching reservation detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    try {
      // 1. Update reservation guest count & assigned table
      await api.patch(`/reservasi/${id}`, {
        jumlah_tamu: parseInt(editData.jumlah_tamu),
        id_meja: editData.id_meja ? parseInt(editData.id_meja) : null
      });

      // 2. Update reservation status
      if (editData.status && editData.status !== reservation.status) {
        await api.patch(`/reservasi/${id}/status`, { status: editData.status });
      }

      // 3. Update customer details if customer ID exists
      if (reservation.id_customer) {
        await api.patch(`/customers/${reservation.id_customer}`, {
          nama: editData.nama,
          no_telp: editData.no_telp
        });
      }

      setIsEditing(false);
      fetchData();
      alert("Reservation details updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update reservation details");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await api.patch(`/reservasi/${id}/status`, { status: 'BATAL' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel reservation");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'MENUNGGU': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DIKONFIRMASI':
      case 'DITERIMA':
      case 'DATANG': return 'bg-green-100 text-green-800 border-green-200';
      case 'BATAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'SELESAI': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading details...</div>;
  if (!reservation) return <div className="p-10 text-center text-red-500">Reservation not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate('/admin/reservations')} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-serif text-gray-800">Reservation Details</h2>
          <p className="text-sm text-gray-500">RES-{reservation.id} • {reservation.customer?.nama}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-3">
             {isEditing ? (
               <div className="flex items-center space-x-2">
                 <span className="text-xs font-bold text-gray-600">Status:</span>
                 <select 
                   value={editData.status} 
                   onChange={e => setEditData({...editData, status: e.target.value})}
                   className="text-xs font-bold border rounded-md px-2 py-1 bg-white focus:outline-none focus:border-primary"
                 >
                   <option value="MENUNGGU">MENUNGGU (Pending)</option>
                   <option value="DIKONFIRMASI">DIKONFIRMASI (Confirmed)</option>
                   <option value="DATANG">DATANG (Seated)</option>
                   <option value="SELESAI">SELESAI (Completed)</option>
                   <option value="BATAL">BATAL (Cancelled)</option>
                 </select>
               </div>
             ) : (
               <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(reservation.status)}`}>
                 {reservation.status}
               </span>
             )}

             {reservation.reservasi_qr?.token && (
               <span className="px-3 py-1 rounded-full text-xs font-mono bg-gray-100 text-gray-600 border border-gray-200">
                 Token: {reservation.reservasi_qr.token}
               </span>
             )}
          </div>

          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm flex items-center cursor-pointer">
                  <X className="w-4 h-4 mr-2" /> Cancel Edit
                </button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-primary hover:bg-secondary text-white font-bold rounded-lg text-sm flex items-center shadow-sm cursor-pointer">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-sm flex items-center cursor-pointer">
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Reservation Details
                </button>
                {reservation.status !== 'BATAL' && reservation.status !== 'SELESAI' && (
                  <button onClick={handleCancel} className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg text-sm flex items-center cursor-pointer">
                    <XCircle className="w-4 h-4 mr-2" /> Cancel Reservation
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Left Column: Customer & Session */}
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                <Info className="w-4 h-4 mr-2" /> Customer Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Customer Name</label>
                      <input 
                        type="text" 
                        value={editData.nama} 
                        onChange={e => setEditData({...editData, nama: e.target.value})}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={editData.no_telp} 
                        onChange={e => setEditData({...editData, no_telp: e.target.value})}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-gray-800 mb-1 flex items-center">
                      <User className="w-4 h-4 mr-2 text-primary" />
                      {reservation.customer?.nama || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {reservation.customer?.no_telp || 'No phone'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> Session Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="font-medium text-gray-800">{reservation.jadwal_sesi?.tanggal}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Session Phase</span>
                  <span className="font-medium text-gray-800">{reservation.jadwal_sesi?.sesi_makan?.nama}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Time</span>
                  <span className="font-medium text-gray-800">{reservation.jadwal_sesi?.sesi_makan?.waktu_mulai} - {reservation.jadwal_sesi?.sesi_makan?.waktu_selesai}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Specifics */}
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" /> Booking Info
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Number of Guests</span>
                  {isEditing ? (
                     <input type="number" min="1" value={editData.jumlah_tamu} onChange={e => setEditData({...editData, jumlah_tamu: e.target.value})} className="w-24 px-2 py-1 border rounded text-right focus:outline-none focus:border-primary text-sm font-bold" />
                  ) : (
                     <span className="font-bold text-gray-800">{reservation.jumlah_tamu} Pax</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Assigned Table</span>
                  {isEditing ? (
                     <select value={editData.id_meja} onChange={e => setEditData({...editData, id_meja: e.target.value})} className="border rounded px-3 py-1.5 focus:outline-none focus:border-primary text-sm font-bold bg-white">
                       <option value="">No Table Assigned</option>
                       {tables.map(t => (
                         <option key={t.id} value={t.id}>Table {t.no_meja} (Cap: {t.kapasitas})</option>
                       ))}
                     </select>
                  ) : (
                     <span className="font-bold text-primary flex items-center">
                       <MapPin className="w-4 h-4 mr-1" />
                       {reservation.reservasi_meja?.[0]?.meja?.no_meja ? `Table ${reservation.reservasi_meja[0].meja.no_meja}` : 'Not Assigned'}
                     </span>
                  )}
                </div>
              </div>
            </div>
            
            {reservation.dining_session && reservation.dining_session.length > 0 && (
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                 <h4 className="font-bold text-blue-800 mb-1 text-sm">Active Dining Session</h4>
                 <p className="text-xs text-blue-600">This reservation has been checked in and has an active dining session.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
