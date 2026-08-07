import React from 'react';
import { ShoppingCart, Plus, Minus, Check, AlertCircle } from 'lucide-react';

export default function OrderCart({
  title = 'Order Cart',
  cart = [],
  totalCart = 0,
  selectedTable,
  activeTables = [],
  onTableChange,
  onAdd,
  onRemove,
  onCheckout,
  isCheckingOut = false,
  checkoutLabel = 'Submit Order'
}) {
  const hasActiveTables = activeTables && activeTables.length > 0;

  return (
    <div className="w-full lg:w-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <ShoppingCart className="w-5 h-5 mr-2 text-primary dark:text-accent" /> {title}
        </h3>

        <div className="mt-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Target Table</label>
          {hasActiveTables ? (
            <select
              className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary"
              value={selectedTable || ''}
              onChange={(e) => onTableChange && onTableChange(Number(e.target.value))}
            >
              {activeTables.map(t => (
                <option key={t.id || t.no_meja || t} value={t.id || t.no_meja || t}>
                  Table {t.no_meja || t} ({t.customerName ? `Guest: ${t.customerName}` : 'Active Guest'})
                </option>
              ))}
            </select>
          ) : (
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
              No Active Seated Tables Currently
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto min-h-[200px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-400 py-10">
            <ShoppingCart className="w-12 h-12 opacity-20 mb-2" />
            <p className="text-sm font-semibold">No items added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{item.name || item.nama}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {item.price ? `Rp ${Number(item.price).toLocaleString()}` : item.course}
                  </p>
                </div>

                <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 border border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                  <button
                    onClick={() => onAdd(item)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        {totalCart > 0 && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 dark:text-gray-300 font-bold text-sm">Total Amount</span>
            <span className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Rp {Number(totalCart).toLocaleString()}</span>
          </div>
        )}
        <button 
          onClick={onCheckout}
          disabled={cart.length === 0 || isCheckingOut || !hasActiveTables}
          className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-sm"
        >
          {isCheckingOut ? (
            <span className="animate-pulse">Processing Order...</span>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              {hasActiveTables ? checkoutLabel : 'No Active Table Selected'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
