import React, { useState, useEffect } from 'react';
import { PackagePlus, Calendar, Truck, Check } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import api from '../../api';

export default function RestockRoutine() {
  const { ingredients, fetchData } = useAdminContext();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    id_bahan: '',
    qty: '',
    unit: 'pcs',
    supplier: '',
    cost: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/inventory-log');
      // Filter only "IN" types for restock history
      const restockData = data.filter(log => log.tipe === 'IN');
      setHistory(restockData);
    } catch (err) {
      console.error("Failed to fetch inventory log", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_bahan || !formData.qty) return;

    // We store supplier and cost in keterangan as JSON string to extract later
    const keteranganObj = {
      supplier: formData.supplier,
      cost: Number(formData.cost) || 0,
      date: formData.date
    };

    try {
      await api.post('/inventory-log/adjust', {
        id_bahan: formData.id_bahan,
        jenis_mutasi: 'IN', // This becomes tipe in DB
        jumlah: Number(formData.qty),
        keterangan: JSON.stringify(keteranganObj)
      });
      
      // Reset form
      setFormData({ id_bahan: '', qty: '', unit: 'pcs', supplier: '', cost: '', date: new Date().toISOString().split('T')[0] });
      
      // Refresh local history and global ingredients stock
      await fetchHistory();
      await fetchData(false); 
      
      alert('Restock recorded successfully!');
    } catch (err) {
      console.error("Failed to record restock", err);
      alert('Failed to record restock.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Restock Form */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-serif text-gray-800 flex items-center">
            <PackagePlus className="w-5 h-5 mr-2 text-primary" /> Log New Restock
          </h2>
          <p className="text-sm text-gray-500 mt-1">Record incoming inventory deliveries</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient</label>
            <select
              required
              value={formData.id_bahan}
              onChange={(e) => {
                const selected = ingredients.find(i => i.id === Number(e.target.value));
                setFormData({
                  ...formData, 
                  id_bahan: e.target.value,
                  unit: selected ? selected.unit : 'pcs'
                });
              }}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Ingredient...</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input 
                type="number" 
                required
                min="0.01"
                step="0.01"
                placeholder="0"
                value={formData.qty}
                onChange={(e) => setFormData({...formData, qty: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input 
                type="text" 
                disabled
                value={formData.unit}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (Rp)</label>
            <input 
              type="number" 
              placeholder="e.g. 500000"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: e.target.value})}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Vendor</label>
            <input 
              type="text" 
              placeholder="Supplier name"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-secondary transition-colors flex justify-center items-center">
              <Check className="w-5 h-5 mr-2" /> Save Restock Record
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Restock History */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-serif text-gray-800">Restock History</h2>
          <p className="text-sm text-gray-500 mt-1">Recent incoming deliveries</p>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-gray-500 text-center py-8">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No restock history found.</p>
            ) : history.map((record) => {
              // Parse keterangan
              let meta = { supplier: 'Unknown', cost: 0, date: new Date(record.created_at).toLocaleDateString() };
              try {
                if (record.keterangan && record.keterangan.startsWith('{')) {
                  meta = JSON.parse(record.keterangan);
                } else if (record.keterangan) {
                  meta.supplier = record.keterangan;
                }
              } catch (e) {}

              // Get actual unit from context if available, otherwise guess
              const ingredientDetails = ingredients.find(i => i.id === record.id_bahan);
              const unit = ingredientDetails ? ingredientDetails.unit : 'pcs';

              return (
                <div key={record.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4 hover:border-primary/30 transition-colors">
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded mr-2">LOG-{record.id}</span>
                      <span className="font-bold text-gray-900 text-lg">{record.bahan?.nama || 'Unknown Ingredient'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2 gap-4">
                      <span className="flex items-center"><Truck className="w-4 h-4 mr-1 text-gray-400" /> {meta.supplier || 'Unknown Supplier'}</span>
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-gray-400" /> {meta.date || new Date(record.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                    <div className="text-center sm:text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Quantity</p>
                      <p className="font-bold text-primary text-lg">+{record.jumlah} <span className="text-sm font-normal text-gray-600">{unit}</span></p>
                    </div>
                    <div className="text-center sm:text-right mt-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cost</p>
                      <p className="font-medium text-gray-800">Rp {(meta.cost || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
