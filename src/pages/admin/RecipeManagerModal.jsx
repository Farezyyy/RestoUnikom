import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import api from '../../api';

export default function RecipeManagerModal({ menuId, onClose }) {
  const { menuItems, ingredients, recipes, fetchData } = useAdminContext();
  
  const menu = menuItems.find(m => m.id === menuId);
  const menuRecipes = recipes.filter(r => r.id_menu === menuId);
  
  const [newIngredientId, setNewIngredientId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newIngredientId || !newQuantity) return;
    
    setLoading(true);
    try {
      await api.post('/resep', {
        id_menu: menuId,
        id_bahan: parseInt(newIngredientId),
        jumlah: parseFloat(newQuantity)
      });
      setNewIngredientId('');
      setNewQuantity('');
      await fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add ingredient to recipe.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (recipeId) => {
    if(window.confirm("Remove this ingredient from the recipe?")) {
      setLoading(true);
      try {
        await api.delete(`/resep/${recipeId}`);
        await fetchData(false);
      } catch (err) {
        alert("Failed to remove ingredient.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter out ingredients that are already in the recipe
  const availableIngredients = ingredients.filter(ing => !menuRecipes.some(r => r.id_bahan === ing.id));

  if (!menu) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h3 className="text-xl font-serif text-gray-800">Recipe Manager</h3>
            <p className="text-sm text-primary font-medium mt-1">{menu.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">Current Ingredients</h4>
          {menuRecipes.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-100 text-gray-500 italic">
              No ingredients have been added to this recipe yet.
            </div>
          ) : (
            <div className="space-y-3">
              {menuRecipes.map(recipe => {
                const ing = ingredients.find(i => i.id === recipe.id_bahan);
                if (!ing) return null;
                return (
                  <div key={recipe.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 shadow-sm rounded-lg hover:border-primary/30 transition-colors">
                    <div>
                      <p className="font-bold text-gray-800">{ing.name}</p>
                      <p className="text-sm text-gray-500">Current Stock: {ing.stock} {ing.unit}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium text-gray-700">
                        {recipe.jumlah} {ing.unit} required
                      </div>
                      <button 
                        onClick={() => handleRemove(recipe.id)}
                        disabled={loading}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50"
                        title="Remove Ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">Add Ingredient</h4>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-500 mb-1">Select Ingredient</label>
              <select 
                required
                className="w-full p-2.5 border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm" 
                value={newIngredientId} 
                onChange={e => setNewIngredientId(e.target.value)}
              >
                <option value="" disabled>-- Choose Ingredient --</option>
                {availableIngredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
              <input 
                required 
                type="number" 
                step="0.01"
                min="0.01"
                className="w-full p-2.5 border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm" 
                value={newQuantity} 
                onChange={e => setNewQuantity(e.target.value)} 
                placeholder="0.00"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || availableIngredients.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white text-sm font-medium rounded hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
          {availableIngredients.length === 0 && (
            <p className="text-xs text-orange-600 mt-2">All available ingredients are already in this recipe.</p>
          )}
        </div>

      </div>
    </div>
  );
}
