import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle2, ChevronRight, Refrigerator, ChefHat } from 'lucide-react';
import api from '../../api';

export default function InventoryRecipes() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: menuData }, { data: resepData }] = await Promise.all([
          api.get('/menu'),
          api.get('/resep'),
        ]);

        // Group resep by menu, building { id, name, category, ingredients: [...] }
        const byMenu = {};
        for (const r of resepData || []) {
          if (!r.menu || !r.bahan) continue;
          const menuId = r.menu.id;
          if (!byMenu[menuId]) {
            byMenu[menuId] = {
              id: menuId,
              name: r.menu.nama,
              category: r.menu.kategori,
              ingredients: [],
            };
          }
          byMenu[menuId].ingredients.push({
            id: r.bahan.id,
            name: r.bahan.nama,
            required: r.jumlah,
            stock: r.bahan.stok,
            minStock: r.bahan.stok_minimal,
            unit: r.bahan.unit,
          });
        }
        setRecipes(Object.values(byMenu));
      } catch (err) {
        console.error('Failed to load recipes', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStockStatus = (stock, minStock) => {
    if (stock <= minStock * 0.5) return { status: 'critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' };
    if (stock <= minStock) return { status: 'low', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800' };
    return { status: 'good', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800' };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

      {/* Left: Recipe List */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Menu Items</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors flex justify-between items-center ${
                selectedRecipe?.id === recipe.id ? 'bg-primary/5 dark:bg-primary/20 border-l-4 border-l-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div>
                <p className="text-xs text-primary dark:text-accent uppercase tracking-widest font-bold mb-1">{recipe.category}</p>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{recipe.name}</h4>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Recipe Details & Inventory */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
        {selectedRecipe ? (
          <>
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="w-6 h-6 text-primary dark:text-accent" />
                <h2 className="text-3xl font-serif text-gray-800 dark:text-gray-100">{selectedRecipe.name}</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ingredient requirements and current inventory levels</p>
            </div>

            <div className="p-8 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-gray-950/30">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <Refrigerator className="w-5 h-5 mr-2 text-primary dark:text-accent" /> Required Ingredients
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRecipe.ingredients.map(ingredient => {
                  const status = getStockStatus(ingredient.stock, ingredient.minStock);

                  return (
                    <div key={ingredient.id} className={`p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col`}>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{ingredient.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${status.bg} ${status.color} border ${status.border}`}>
                          {status.status === 'good' ? (
                            <span className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Sufficient</span>
                          ) : (
                            <span className="flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Low Stock</span>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-auto text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Required</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{ingredient.required} {ingredient.unit}</p>
                        </div>
                        <div className="border-l border-r border-gray-100 dark:border-gray-800 px-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Stock</p>
                          <p className={`font-medium ${status.color}`}>{ingredient.stock} {ingredient.unit}</p>
                        </div>
                        <div className="pl-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Min. Stock</p>
                          <p className="font-medium text-gray-500 dark:text-gray-400">{ingredient.minStock} {ingredient.unit}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <ChefHat className="w-16 h-16 opacity-30 mb-4" />
            <h3 className="text-xl font-serif text-gray-500 dark:text-gray-400 mb-2">Select a Recipe</h3>
            <p className="text-sm max-w-sm">Choose a menu item from the list to view its ingredient requirements and check current inventory levels.</p>
          </div>
        )}
      </div>
    </div>
  );
}
