import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import DaySelector from '../../components/common/DaySelector';
import useWeeklyMenu from '../../data/useWeeklyMenu';

export default function MenuViewer() {
  const [activeDay, setActiveDay] = useState('Monday');
  const [searchQuery, setSearchQuery] = useState('');
  const { week, loading } = useWeeklyMenu();

  const currentMenu = week?.[activeDay] || { A: null, B: null };

  const filterItems = (set) => {
    if (!set?.items) return [];
    if (!searchQuery) return set.items;
    return set.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.allergens?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Menu Reference</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">View daily menus, ingredients, and allergen info</p>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search items or allergens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <DaySelector activeDay={activeDay} setActiveDay={setActiveDay} variant="staff" />

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading menu data...</div>
        ) : !week ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Menu unavailable.</div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[currentMenu.A, currentMenu.B].map((set, idx) => {
              if (!set) return null;
              const filteredItems = filterItems(set);

              return (
                <div key={idx} className="space-y-4">
                  <h4 className="text-xl font-serif text-primary dark:text-accent border-b border-gray-100 dark:border-gray-800 pb-2">
                    {set.name}
                  </h4>

                  {filteredItems.length > 0 ? (
                    <div className="space-y-4">
                      {filteredItems.map((item, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                                {item.course}
                              </span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">{item.name}</span>
                            </div>
                            <span className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm whitespace-nowrap">
                              ⏱ {item.prep}
                            </span>
                          </div>

                          {item.allergens && item.allergens.length > 0 ? (
                            <div className="flex items-center gap-2 mt-3 text-xs">
                              <span className="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                                <Info className="w-3 h-3" /> Allergens:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {item.allergens.map(a => (
                                  <span key={a} className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400 px-2 py-0.5 rounded">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                              <Info className="w-3 h-3" /> Allergen-free
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No items match your search.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
