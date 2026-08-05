import React, { useState } from 'react';
import { Search, Edit2, AlertTriangle, CheckCircle2, Trash2, Plus, X } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import api from '../../api';

export default function StorageManager() {
  const { ingredients, updateIngredientStock, loading, fetchData } = useAdminContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState(0);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBahan, setNewBahan] = useState({ nama: '', stok: 0, unit: '', stok_minimal: 0 });

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { label: 'Empty', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle };
    if (stock <= minStock) return { label: 'Running Out', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle };
    return { label: 'Available', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 };
  };

  const saveEdit = (id) => {
    updateIngredientStock(id, editStock);
    setEditingId(null);
  };

  const handleDelete = async (id, name) => {
    if(window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.delete(`/bahan/${id}`);
        fetchData(false);
      } catch (err) {
        alert("Failed to delete ingredient. It may be used in a recipe.");
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bahan', {
        nama: newBahan.nama,
        stok: parseFloat(newBahan.stok),
        unit: newBahan.unit,
        stok_minimal: parseFloat(newBahan.stok_minimal)
      });
      setShowAddModal(false);
      setNewBahan({ nama: '', stok: 0, unit: '', stok_minimal: 0 });
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add ingredient.");
    }
  };

  const filteredIngredients = ingredients.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter !== 'All') {
      const status = getStockStatus(item.stock, item.minStock).label;
      matchesStock = status === stockFilter;
    }
    
    return matchesSearch && matchesStock;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Ingredients from Database...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-serif text-gray-800">Storage & Ingredients</h2>
            <p className="text-sm text-gray-500 mt-1">Manage raw inventory levels</p>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <input 
                type="text" 
                placeholder="Search ingredient..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-secondary transition flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Ingredient
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 items-start sm:items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 mr-2">Stock:</span>
            <select 
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="text-sm border-gray-200 rounded-lg py-1.5 focus:border-primary focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Running Out">Running Out</option>
              <option value="Empty">Empty</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <th className="p-4">Ingredient Name</th>
              <th className="p-4">Current Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map(item => {
              const status = getStockStatus(item.stock, item.minStock);
              const Icon = status.icon;
              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-900">{item.name}</td>
                  <td className="p-4">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-24 p-1 border border-primary rounded text-sm focus:outline-none"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => saveEdit(item.id)} className="p-1 bg-green-100 text-green-700 rounded text-xs font-bold px-2">Save</button>
                      </div>
                    ) : (
                      <span className="font-bold text-gray-800">{item.stock} <span className="text-sm font-normal text-gray-500">{item.unit}</span></span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      <Icon className="w-3 h-3 mr-1" /> {status.label}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => { setEditingId(item.id); setEditStock(item.stock); }}
                      disabled={editingId !== null}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50" 
                      title="Update Stock"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors ml-2" 
                      title="Delete Ingredient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredIngredients.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500 italic">No ingredients match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-serif text-gray-800">Add New Ingredient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newBahan.nama} onChange={e => setNewBahan({...newBahan, nama: e.target.value})} placeholder="e.g. Wagyu A5 Beef" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input required type="number" step="0.01" className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newBahan.stok} onChange={e => setNewBahan({...newBahan, stok: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input required type="text" className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newBahan.unit} onChange={e => setNewBahan({...newBahan, unit: e.target.value})} placeholder="e.g. kg, gram, pcs" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Alert</label>
                <input required type="number" step="0.01" className="w-full p-2 border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newBahan.stok_minimal} onChange={e => setNewBahan({...newBahan, stok_minimal: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary transition">Save Ingredient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
