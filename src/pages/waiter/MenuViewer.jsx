import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import DaySelector from '../../components/common/DaySelector';

export default function MenuViewer() {
  const [activeDay, setActiveDay] = useState('Monday');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data with some staff-specific details (allergens, prep time)
  const menuData = {
    'Monday': {
      A: { 
        name: 'Menu A (Signature)', 
        items: [
          { course: 'Appetizer', name: 'Truffle Arancini with Saffron Aioli', allergens: ['Dairy', 'Gluten'], prep: '10 min' },
          { course: 'Main', name: 'Wagyu Beef Tenderloin & Pomme Purée', allergens: ['Dairy'], prep: '25 min' },
          { course: 'Dessert', name: 'Dark Chocolate Dome with Raspberry', allergens: ['Dairy', 'Nuts'], prep: '5 min' }
        ]
      },
      B: { 
        name: 'Menu B (Ocean)', 
        items: [
          { course: 'Appetizer', name: 'Scallop Carpaccio & Caviar', allergens: ['Shellfish'], prep: '8 min' },
          { course: 'Main', name: 'Pan-Seared Halibut with Beurre Blanc', allergens: ['Fish', 'Dairy'], prep: '20 min' },
          { course: 'Dessert', name: 'Lemon Yuzu Tart with Meringue', allergens: ['Dairy', 'Gluten', 'Eggs'], prep: '5 min' }
        ]
      }
    },
    'Tuesday': {
      A: { 
        name: 'Menu A (Classic)', 
        items: [
          { course: 'Appetizer', name: 'Foie Gras Terrine', allergens: ['Dairy', 'Gluten'], prep: '10 min' },
          { course: 'Main', name: 'Duck Breast with Cherry Glaze', allergens: [], prep: '25 min' },
          { course: 'Dessert', name: 'Pistachio Soufflé', allergens: ['Dairy', 'Eggs', 'Nuts'], prep: '15 min' }
        ]
      },
      B: { 
        name: 'Menu B (Earth)', 
        items: [
          { course: 'Appetizer', name: 'Lobster Bisque', allergens: ['Shellfish', 'Dairy'], prep: '10 min' },
          { course: 'Main', name: 'Herb-Crusted Rack of Lamb', allergens: ['Gluten'], prep: '25 min' },
          { course: 'Dessert', name: 'Vanilla Bean Panna Cotta', allergens: ['Dairy', 'Gelatin'], prep: '5 min' }
        ]
      }
    }
    // (Other days would follow the same structure, repeating Monday for simplicity if not defined)
  };

  const getDayData = (day) => menuData[day] || menuData['Monday'];
  const currentMenu = getDayData(activeDay);

  const filterItems = (menu) => {
    if (!searchQuery) return menu.items;
    return menu.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.allergens.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Menu Reference</h3>
            <p className="text-sm text-gray-500">View daily menus, ingredients, and allergen info</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search items or allergens..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <DaySelector activeDay={activeDay} setActiveDay={setActiveDay} variant="staff" />

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[currentMenu.A, currentMenu.B].map((menu, idx) => {
            const filteredItems = filterItems(menu);
            
            return (
              <div key={idx} className="space-y-4">
                <h4 className="text-xl font-serif text-primary border-b border-gray-100 pb-2">
                  {menu.name}
                </h4>
                
                {filteredItems.length > 0 ? (
                  <div className="space-y-4">
                    {filteredItems.map((item, i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              {item.course}
                            </span>
                            <span className="text-gray-900 font-medium">{item.name}</span>
                          </div>
                          <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600 shadow-sm whitespace-nowrap">
                            ⏱ {item.prep}
                          </span>
                        </div>
                        
                        {item.allergens.length > 0 ? (
                          <div className="flex items-center gap-2 mt-3 text-xs">
                            <span className="text-orange-600 font-medium flex items-center gap-1">
                              <Info className="w-3 h-3" /> Allergens:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {item.allergens.map(a => (
                                <span key={a} className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-green-600 font-medium flex items-center gap-1">
                            <Info className="w-3 h-3" /> Allergen-free
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No items match your search.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
