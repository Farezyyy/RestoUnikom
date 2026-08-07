import React, { useState } from 'react';
import { Search, Edit2, Check, X, AlertCircle, HelpCircle, Plus, Trash2, BookOpen } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import api from '../../api';
import RecipeManagerModal from './RecipeManagerModal';

export default function MenuManager() {
  const { menuItems, getMenuAvailability, toggleMenuManualStatus, updateMenuPrice, loading, fetchData } = useAdminContext();
  const [searchQuery, setSearchQuery] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMenu, setNewMenu] = useState({ nama: '', kategori: 'MAIN', harga: 0 });
  const [activeRecipeMenuId, setActiveRecipeMenuId] = useState(null);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditPrice(item.price);
  };

  const saveEdit = (id) => {
    updateMenuPrice(id, editPrice);
    setEditingId(null);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.delete(`/menu/${id}`);
        fetchData(false);
      } catch (err) {
        alert("Failed to delete menu. It may be referenced in active orders.");
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/menu', {
        nama: newMenu.nama,
        kategori: newMenu.kategori,
        harga: parseFloat(newMenu.harga)
      });
      setShowAddModal(false);
      setNewMenu({ nama: '', kategori: 'MAIN', harga: 0 });
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add menu item.");
    }
  };

  const filtered = menuItems.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Menu from Database...</div>;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif text-gray-800 dark:text-gray-100">Menu & Recipe Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage dishes, prices, and recipe links</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-secondary transition flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300">
              <th className="p-4">Item Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price (Rp)</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const availability = getMenuAvailability(item);
              const isAvailable = availability.available;

              return (
                <tr key={item.id} className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${isAvailable ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-red-50/30 dark:bg-red-900/20'}`}>
                  <td className="p-4 font-bold text-gray-800 dark:text-gray-100">{item.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs tracking-wider uppercase font-medium">{item.category}</span>
                  </td>
                  <td className="p-4">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-32 p-1 border border-primary rounded text-sm focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => saveEdit(item.id)} className="p-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-gray-100">Rp {item.price.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleMenuManualStatus(item.id)}
                        title="Toggle Manual Status"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>

                      {!isAvailable && (
                        <div className="ml-3 text-xs text-red-600 dark:text-red-400 font-medium flex items-center group relative cursor-help">
                          <AlertCircle className="w-4 h-4 mr-1" /> Sold Out
                          <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />

                          <div className="absolute left-full ml-2 w-max px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {availability.reason}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setActiveRecipeMenuId(item.id)}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded transition-colors mr-2"
                      title="Manage Recipe"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      disabled={editingId !== null}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-colors disabled:opacity-50 mr-2"
                      title="Edit Price"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded transition-colors"
                      title="Delete Menu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400 italic">No menu items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-serif text-gray-800 dark:text-gray-100">Add New Menu Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Menu Name</label>
                <input required type="text" className="w-full p-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newMenu.nama} onChange={e => setNewMenu({ ...newMenu, nama: e.target.value })} placeholder="e.g. Wagyu Steak" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select required className="w-full p-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newMenu.kategori} onChange={e => setNewMenu({ ...newMenu, kategori: e.target.value })}>
                  <option value="APPETIZER">APPETIZER</option>
                  <option value="MAIN">MAIN COURSE</option>
                  <option value="DESSERT">DESSERT</option>
                  <option value="BEVERAGE">BEVERAGE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (Rp)</label>
                <input required type="number" min="0" className="w-full p-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newMenu.harga} onChange={e => setNewMenu({ ...newMenu, harga: e.target.value })} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary transition">Save Menu Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeRecipeMenuId && (
        <RecipeManagerModal
          menuId={activeRecipeMenuId}
          onClose={() => setActiveRecipeMenuId(null)}
        />
      )}
    </div>
  );
}
