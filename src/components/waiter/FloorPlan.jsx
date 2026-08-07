import React from 'react';

const statusColors = {
  'available': 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.4)] hover:bg-amber-200 dark:hover:bg-amber-900/60',
  'occupied': 'bg-red-100 dark:bg-red-900/40 border-red-500 dark:border-red-600 text-red-900 dark:text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.4)] hover:bg-red-200 dark:hover:bg-red-900/60',
  'reserved': 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 dark:border-blue-600 text-blue-900 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.4)] hover:bg-blue-200 dark:hover:bg-blue-900/60',
  'needs-clearing': 'bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.4)]',
  'disabled': 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed',
};

export const statusIndicators = {
  'available': 'bg-amber-400',
  'occupied': 'bg-red-500',
  'reserved': 'bg-blue-500',
  'needs-clearing': 'bg-orange-500',
  'disabled': 'bg-gray-400',
};

export default function FloorPlan({ tables, onSelectTable }) {
  const renderTableShape = (table) => {
    let baseStyle = "absolute flex items-center justify-center cursor-pointer transition-all hover:scale-105 border-2 rounded-lg font-bold text-sm backdrop-blur-sm ";
    baseStyle += (statusColors[table.status] || 'bg-gray-500 text-white');

    const pos = { left: `${table.x}%`, top: `${table.y}%`, transform: 'translate(-50%, -50%)' };

    if (table.shape === 'square') Object.assign(pos, { width: '40px', height: '40px' });
    if (table.shape === 'rect-h') Object.assign(pos, { width: '60px', height: '40px' });
    if (table.shape === 'rect-v') Object.assign(pos, { width: '40px', height: '60px' });
    if (table.shape === 'round') Object.assign(pos, { width: '45px', height: '45px', borderRadius: '50%' });

    return (
      <div 
        key={table.id} 
        style={pos} 
        className={baseStyle}
        onClick={() => onSelectTable(table)}
      >
        {table.label}
        <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${statusIndicators[table.status]}`}></span>
      </div>
    );
  };

  return (
    <div className="relative w-[800px] h-[600px] bg-slate-50 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-600 rounded-sm shadow-inner shrink-0 overflow-hidden">
      
      {/* SVG Walls overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600">
        
        {/* Private Room (Top Left) */}
        {/* 0,0 to 250,200 */}
        <path d="M 0,200 L 250,200 L 250,0" fill="none" stroke="#94a3b8" strokeWidth="4" />
        <text x="15" y="25" fill="#64748b" fontSize="14" fontWeight="bold">PRIVATE ROOM</text>
        {/* Private Room Door */}
        <path d="M 180,200 A 30 30 0 0 0 210,170 L 210,200" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4" />

        {/* Toilets & Storage (Top Middle) */}
        {/* 250,0 to 800,100 */}
        <path d="M 250,100 L 800,100" fill="none" stroke="#94a3b8" strokeWidth="4" />
        <path d="M 370,0 L 370,100" fill="none" stroke="#94a3b8" strokeWidth="4" /> {/* Male/Female divider */}
        <path d="M 490,0 L 490,100" fill="none" stroke="#94a3b8" strokeWidth="4" /> {/* Female/Storage divider */}
        <text x="280" y="55" fill="#64748b" fontSize="12" fontWeight="bold">MALE CV</text>
        <text x="400" y="55" fill="#64748b" fontSize="12" fontWeight="bold">FEMALE CV</text>
        <text x="520" y="55" fill="#64748b" fontSize="12" fontWeight="bold">STORAGE</text>
        {/* Doors */}
        <path d="M 290,100 A 20 20 0 0 0 310,80 L 310,100" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4" />
        <path d="M 410,100 A 20 20 0 0 1 430,120 L 430,100" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4" />

        {/* Kitchen (Diagonal Wall) */}
        {/* From Storage (550,100) down to right wall (800,400) */}
        <path d="M 550,100 L 800,400" fill="none" stroke="#94a3b8" strokeWidth="4" />
        <text x="650" y="220" fill="#64748b" fontSize="16" fontWeight="bold" transform="rotate(50 650,220)">KITCHEN</text>
        {/* Kitchen Door */}
        <path d="M 610,172 A 25 25 0 0 1 585,190 L 585,142" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4" />

        {/* Outdoor Area (L-Shape Bottom Left) */}
        {/* 0,450 -> 480,450 -> 480,600 */}
        <path d="M 0,450 L 480,450 L 480,600" fill="none" stroke="#94a3b8" strokeWidth="4" />
        <text x="15" y="585" fill="#64748b" fontSize="14" fontWeight="bold">OUTDOOR</text>
        {/* Outdoor Door */}
        <path d="M 380,450 A 30 30 0 0 1 410,420 L 410,450" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4" />

        {/* Counter (Attached to Outdoor vertical wall) */}
        {/* 480,450 -> 560,450 -> 560,490 */}
        <path d="M 480,450 L 560,450 L 560,490 L 480,490" fill="none" stroke="#94a3b8" strokeWidth="4" />
        <text x="495" y="475" fill="#64748b" fontSize="12" fontWeight="bold">COUNTER</text>

        {/* Entrance (Bottom Right) */}
        <path d="M 700,600 L 700,520 L 800,520" fill="none" stroke="#94a3b8" strokeWidth="4" />
        <text x="715" y="545" fill="#64748b" fontSize="14" fontWeight="bold">ENTRANCE</text>
        {/* Entrance Double Doors */}
        <path d="M 720,600 A 25 25 0 0 1 745,575 L 745,600" fill="none" stroke="#64748b" strokeWidth="2" />
        <path d="M 795,600 A 25 25 0 0 0 770,575 L 770,600" fill="none" stroke="#64748b" strokeWidth="2" />
      </svg>

      {/* Render Tables */}
      {tables.map(renderTableShape)}
    </div>
  );
}
