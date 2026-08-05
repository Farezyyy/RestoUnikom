import React from 'react';

const SESSIONS = [
  { id: 'S1', time: '09:00-10:30', label: 'Morning 1' },
  { id: 'S2', time: '12:00-13:30', label: 'Lunch' },
  { id: 'S3', time: '15:00-16:30', label: 'Afternoon' },
  { id: 'S4', time: '18:00-19:30', label: 'Dinner 1' },
  { id: 'S5', time: '21:00-22:30', label: 'Dinner 2' }
];

export default function SessionFilter({ selectedSession, onSelectSession }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm font-medium text-gray-600 mr-2">Session:</span>
      <button 
        onClick={() => onSelectSession('ALL')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          selectedSession === 'ALL' 
            ? 'bg-primary text-white border-primary shadow-sm' 
            : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
        }`}
      >
        All Sessions
      </button>
      {SESSIONS.map(s => (
        <button 
          key={s.id}
          onClick={() => onSelectSession(s.time)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            selectedSession === s.time 
              ? 'bg-primary text-white border-primary shadow-sm' 
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
          }`}
          title={s.label}
        >
          {s.time}
        </button>
      ))}
    </div>
  );
}
