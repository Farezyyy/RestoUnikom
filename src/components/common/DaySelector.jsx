import React from 'react';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DaySelector({ activeDay, setActiveDay, variant = 'public' }) {
  if (variant === 'staff') {
    return (
      <div className="p-4 border-b border-gray-100 flex overflow-x-auto hide-scrollbar gap-2">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeDay === day 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-4">
      {DAYS.map(day => (
        <button
          key={day}
          onClick={() => setActiveDay(day)}
          className={`px-6 py-2 md:py-3 rounded-full border transition-all duration-300 uppercase tracking-widest text-xs md:text-sm font-medium ${
            activeDay === day 
              ? 'bg-primary border-primary text-cream shadow-[0_0_15px_rgba(154,59,59,0.5)] scale-105' 
              : 'border-white/20 text-cream/50 hover:border-accent hover:text-accent hover:scale-105'
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
