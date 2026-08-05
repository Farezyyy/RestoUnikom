import React from 'react';

export default function MenuCard({ 
  title, 
  subtitle, 
  appetizer, 
  appetizerImg,
  mainCourse, 
  mainCourseImg,
  dessert, 
  dessertImg,
  variant = 'landing',
  accentColor = 'primary'
}) {
  if (variant === 'full') {
    const blurColor = accentColor === 'primary' ? 'bg-primary' : 'bg-secondary';
    
    return (
      <div className="content-fade glass-dark p-8 md:p-12 rounded-2xl space-y-8 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-32 h-32 ${blurColor}/20 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 group-hover:${blurColor}/40 transition-all duration-700`}></div>
        
        <div className="border-b border-white/10 pb-6">
          <h3 className="text-3xl font-serif text-accent">{title}</h3>
          {subtitle && <p className="text-sm text-cream/50 uppercase tracking-widest mt-2 font-light">{subtitle}</p>}
        </div>
        
        <div className="space-y-6 relative z-10">
          {/* Appetizer */}
          <div className="flex items-center gap-5 p-3 rounded-xl hover:bg-white/5 transition-colors">
            {appetizerImg && (
              <img 
                src={appetizerImg} 
                alt={appetizer} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shadow-md shrink-0 border border-white/10" 
              />
            )}
            <div>
              <p className="text-xs text-primary uppercase tracking-widest mb-1 font-semibold">Appetizer</p>
              <p className="text-lg md:text-xl text-cream/90 font-serif leading-snug">{appetizer}</p>
            </div>
          </div>

          {/* Main Course */}
          <div className="flex items-center gap-5 p-3 rounded-xl hover:bg-white/5 transition-colors">
            {mainCourseImg && (
              <img 
                src={mainCourseImg} 
                alt={mainCourse} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shadow-md shrink-0 border border-white/10" 
              />
            )}
            <div>
              <p className="text-xs text-primary uppercase tracking-widest mb-1 font-semibold">Main Course</p>
              <p className="text-lg md:text-xl text-cream/90 font-serif leading-snug">{mainCourse}</p>
            </div>
          </div>

          {/* Dessert */}
          <div className="flex items-center gap-5 p-3 rounded-xl hover:bg-white/5 transition-colors">
            {dessertImg && (
              <img 
                src={dessertImg} 
                alt={dessert} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shadow-md shrink-0 border border-white/10" 
              />
            )}
            <div>
              <p className="text-xs text-primary uppercase tracking-widest mb-1 font-semibold">Dessert</p>
              <p className="text-lg md:text-xl text-cream/90 font-serif leading-snug">{dessert}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing variant
  return (
    <div className="glass-dark p-6 md:p-8 rounded-2xl space-y-4 hover:border-accent/50 transition-colors">
      <h3 className="text-xl font-serif text-accent border-b border-white/10 pb-2">{title}</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {appetizerImg && (
            <img src={appetizerImg} alt={appetizer} className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0" />
          )}
          <div>
            <p className="text-xs text-primary uppercase tracking-widest mb-0.5">Appetizer</p>
            <p className="text-cream/90 text-sm font-serif">{appetizer}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {mainCourseImg && (
            <img src={mainCourseImg} alt={mainCourse} className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0" />
          )}
          <div>
            <p className="text-xs text-primary uppercase tracking-widest mb-0.5">Main Course</p>
            <p className="text-cream/90 text-sm font-serif">{mainCourse}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {dessertImg && (
            <img src={dessertImg} alt={dessert} className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0" />
          )}
          <div>
            <p className="text-xs text-primary uppercase tracking-widest mb-0.5">Dessert</p>
            <p className="text-cream/90 text-sm font-serif">{dessert}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
