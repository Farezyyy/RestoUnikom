import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle2, ChevronRight, Refrigerator, ChefHat } from 'lucide-react';

export default function InventoryRecipes() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data representing menu items and their required ingredients
  const recipes = [
    {
      id: 1,
      name: 'Wagyu Beef Tenderloin',
      category: 'Main Course',
      ingredients: [
        { id: 101, name: 'Wagyu A5 (200g)', required: 1, stock: 15, minStock: 10, unit: 'portion' },
        { id: 102, name: 'Potatoes', required: 200, stock: 5000, minStock: 2000, unit: 'g' },
        { id: 103, name: 'Truffle Butter', required: 20, stock: 150, minStock: 200, unit: 'g' }, // Low stock
      ]
    },
    {
      id: 2,
      name: 'Scallop Carpaccio',
      category: 'Appetizer',
      ingredients: [
        { id: 201, name: 'Hokkaido Scallops', required: 3, stock: 8, minStock: 20, unit: 'pcs' }, // Low stock
        { id: 202, name: 'Oscietra Caviar', required: 5, stock: 100, minStock: 50, unit: 'g' },
        { id: 203, name: 'Olive Oil', required: 10, stock: 2000, minStock: 500, unit: 'ml' },
      ]
    },
    {
      id: 3,
      name: 'Dark Chocolate Dome',
      category: 'Dessert',
      ingredients: [
        { id: 301, name: '70% Dark Chocolate', required: 50, stock: 1500, minStock: 1000, unit: 'g' },
        { id: 302, name: 'Fresh Raspberries', required: 30, stock: 400, minStock: 500, unit: 'g' }, // Low stock
        { id: 303, name: 'Heavy Cream', required: 100, stock: 3000, minStock: 1000, unit: 'ml' },
      ]
    }
  ];

  const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStockStatus = (stock, minStock) => {
    if (stock <= minStock * 0.5) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (stock <= minStock) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left: Recipe List */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Menu Items</h3>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search recipes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRecipes.map(recipe => (
            <div 
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors flex justify-between items-center ${
                selectedRecipe?.id === recipe.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50'
              }`}
            >
              <div>
                <p className="text-xs text-primary uppercase tracking-widest font-bold mb-1">{recipe.category}</p>
                <h4 className="font-medium text-gray-900">{recipe.name}</h4>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Recipe Details & Inventory */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {selectedRecipe ? (
          <>
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-serif text-gray-800">{selectedRecipe.name}</h2>
              </div>
              <p className="text-sm text-gray-500">Ingredient requirements and current inventory levels</p>
            </div>

            <div className="p-8 flex-1 overflow-y-auto bg-gray-50/30">
              <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center">
                <Refrigerator className="w-5 h-5 mr-2 text-primary" /> Required Ingredients
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRecipe.ingredients.map(ingredient => {
                  const status = getStockStatus(ingredient.stock, ingredient.minStock);
                  
                  return (
                    <div key={ingredient.id} className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col`}>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">{ingredient.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${status.bg} ${status.color} border ${status.border}`}>
                          {status.status === 'good' ? (
                            <span className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Sufficient</span>
                          ) : (
                            <span className="flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Low Stock</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-auto text-sm border-t border-gray-100 pt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Required</p>
                          <p className="font-medium text-gray-900">{ingredient.required} {ingredient.unit}</p>
                        </div>
                        <div className="border-l border-r border-gray-100 px-2">
                          <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                          <p className={`font-medium ${status.color}`}>{ingredient.stock} {ingredient.unit}</p>
                        </div>
                        <div className="pl-2">
                          <p className="text-xs text-gray-500 mb-1">Min. Stock</p>
                          <p className="font-medium text-gray-500">{ingredient.minStock} {ingredient.unit}</p>
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
            <h3 className="text-xl font-serif text-gray-500 mb-2">Select a Recipe</h3>
            <p className="text-sm max-w-sm">Choose a menu item from the list to view its ingredient requirements and check current inventory levels.</p>
          </div>
        )}
      </div>
    </div>
  );
}
