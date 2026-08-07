import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ReservationModal from '../../components/public/ReservationModal';
import Footer from '../../components/public/Footer';
import DaySelector from '../../components/common/DaySelector';
import MenuCard from '../../components/common/MenuCard';
import useWeeklyMenu, { toMenuCardProps } from '../../data/useWeeklyMenu';

export default function MenuPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { week, loading } = useWeeklyMenu();

  const [activeDay, setActiveDay] = useState('Monday');

  useEffect(() => {
    gsap.fromTo('.content-fade',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out' }
    );
  }, []);

  return (
    <div className="bg-dark text-cream min-h-screen font-sans selection:bg-secondary selection:text-cream">
      {/* Navbar */}
      <nav className="w-full z-50 glass px-6 md:px-12 py-4 flex flex-col md:flex-row justify-between items-center">
        <Link to="/" className="text-2xl font-serif font-bold text-accent tracking-widest uppercase mb-2 md:mb-0">
          Resto Unikom
        </Link>
        <div className="flex items-center space-x-4 md:space-x-6">
          <Link to="/" className="text-sm font-medium tracking-widest uppercase text-cream/70 hover:text-accent transition-colors">
            Home
          </Link>
          <Link to="/what-is-fine-dining" className="text-sm font-medium tracking-widest uppercase text-cream/70 hover:text-accent transition-colors">
            Philosophy
          </Link>
          <Link to="/menu" className="text-sm font-medium tracking-widest uppercase text-accent transition-colors border-b border-accent pb-1">
            Menu
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden md:block px-6 py-2 bg-primary/90 text-cream rounded hover:bg-secondary transition-all duration-300 font-medium tracking-wide shadow-[0_0_15px_rgba(154,59,59,0.5)]"
          >
            Book a Table
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="content-fade mb-16">
          <h1 className="text-5xl md:text-7xl font-serif text-accent mb-6">Our Culinary Collection</h1>
          <div className="w-20 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-cream/70 font-light max-w-2xl mx-auto">
            Explore our rotating daily menus, meticulously crafted by our executive chefs to highlight seasonal perfection.
          </p>
        </div>

        {/* Day Selector */}
        <div className="content-fade mb-16">
          <DaySelector activeDay={activeDay} setActiveDay={setActiveDay} variant="public" />
        </div>

        {loading ? (
          <div className="text-center text-cream/70 py-20">Loading this week's menu...</div>
        ) : !week ? (
          <div className="text-center text-cream/70 py-20">Menu unavailable. Please check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 text-left">
            <MenuCard
              variant="full"
              title="Menu A"
              subtitle="Chef's Signature Selection"
              accentColor="primary"
              {...toMenuCardProps(week[activeDay]?.A)}
            />

            <MenuCard
              variant="full"
              title="Menu B"
              subtitle="Ocean & Earth Collection"
              accentColor="secondary"
              {...toMenuCardProps(week[activeDay]?.B)}
            />
          </div>
        )}
        
        <div className="content-fade mt-24">
           <button 
            onClick={() => setIsModalOpen(true)}
            className="px-10 py-4 bg-transparent border border-accent text-accent rounded hover:bg-accent hover:text-dark transition-all duration-500 font-medium tracking-widest uppercase"
          >
            Reserve Your Experience
          </button>
        </div>
      </div>

      <Footer />

      <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
