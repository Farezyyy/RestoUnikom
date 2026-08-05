import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ReservationModal from '../../components/public/ReservationModal';
import Footer from '../../components/public/Footer';
import DaySelector from '../../components/common/DaySelector';
import MenuCard from '../../components/common/MenuCard';

export default function MenuPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo('.content-fade', 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out' }
    );
  }, []);

  const [activeDay, setActiveDay] = useState('Monday');

  const menuData = {
    'Monday': {
      A: {
        app: 'Truffle Arancini with Saffron Aioli',
        appImg: 'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=400&auto=format&fit=crop',
        main: 'Wagyu Beef Tenderloin & Pomme Purée',
        mainImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
        dessert: 'Dark Chocolate Dome with Raspberry',
        dessertImg: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?q=80&w=400&auto=format&fit=crop'
      },
      B: {
        app: 'Scallop Carpaccio & Caviar',
        appImg: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=400&auto=format&fit=crop',
        main: 'Pan-Seared Halibut with Beurre Blanc',
        mainImg: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop',
        dessert: 'Lemon Yuzu Tart with Meringue',
        dessertImg: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=400&auto=format&fit=crop'
      }
    },
    'Tuesday': {
      A: {
        app: 'Foie Gras Terrine',
        appImg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop',
        main: 'Duck Breast with Cherry Glaze',
        mainImg: 'https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?q=80&w=400&auto=format&fit=crop',
        dessert: 'Pistachio Soufflé',
        dessertImg: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400&auto=format&fit=crop'
      },
      B: {
        app: 'Lobster Bisque',
        appImg: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop',
        main: 'Herb-Crusted Rack of Lamb',
        mainImg: 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?q=80&w=400&auto=format&fit=crop',
        dessert: 'Vanilla Bean Panna Cotta',
        dessertImg: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=400&auto=format&fit=crop'
      }
    },
    'Wednesday': {
      A: {
        app: 'Oysters Mignonette',
        appImg: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop',
        main: 'Seared Scallops with Pea Purée',
        mainImg: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=400&auto=format&fit=crop',
        dessert: 'Passionfruit Pavlova',
        dessertImg: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400&auto=format&fit=crop'
      },
      B: {
        app: 'Beef Tartare with Quail Egg',
        appImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
        main: 'Roasted Venison Loin',
        mainImg: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=400&auto=format&fit=crop',
        dessert: 'Classic Tiramisu',
        dessertImg: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=400&auto=format&fit=crop'
      }
    },
    'Thursday': {
      A: {
        app: 'Burrata with Heirloom Tomatoes',
        appImg: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a85?q=80&w=400&auto=format&fit=crop',
        main: 'Risotto al Tartufo',
        mainImg: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?q=80&w=400&auto=format&fit=crop',
        dessert: 'Tarte Tatin',
        dessertImg: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?q=80&w=400&auto=format&fit=crop'
      },
      B: {
        app: 'Crispy Pork Belly',
        appImg: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=400&auto=format&fit=crop',
        main: 'Miso Black Cod',
        mainImg: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?q=80&w=400&auto=format&fit=crop',
        dessert: 'Matcha Green Tea Mille-Feuille',
        dessertImg: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop'
      }
    },
    'Friday': {
      A: {
        app: 'Smoked Salmon Blinis',
        appImg: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop',
        main: 'Chateaubriand for Two',
        mainImg: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=400&auto=format&fit=crop',
        dessert: 'Grand Marnier Crêpes Suzette',
        dessertImg: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=400&auto=format&fit=crop'
      },
      B: {
        app: 'Tuna Tartare',
        appImg: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=400&auto=format&fit=crop',
        main: 'Lobster Thermidor',
        mainImg: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=400&auto=format&fit=crop',
        dessert: 'White Chocolate Fondant',
        dessertImg: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400&auto=format&fit=crop'
      }
    },
    'Saturday': {
      A: {
        app: 'Caviar Tasting',
        appImg: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=400&auto=format&fit=crop',
        main: 'Tomahawk Steak with Chimichurri',
        mainImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
        dessert: 'Gold Leaf Chocolate Truffles',
        dessertImg: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=400&auto=format&fit=crop'
      },
      B: {
        app: 'King Crab Legs',
        appImg: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=400&auto=format&fit=crop',
        main: 'Chilean Sea Bass',
        mainImg: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop',
        dessert: 'Strawberry Consommé',
        dessertImg: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?q=80&w=400&auto=format&fit=crop'
      }
    },
    'Sunday': {
      A: {
        app: 'French Onion Soup',
        appImg: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop',
        main: 'Classic Beef Wellington',
        mainImg: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=400&auto=format&fit=crop',
        dessert: 'Baked Alaska',
        dessertImg: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400&auto=format&fit=crop'
      },
      B: {
        app: 'Escargots de Bourgogne',
        appImg: 'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=400&auto=format&fit=crop',
        main: 'Coq au Vin',
        mainImg: 'https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?q=80&w=400&auto=format&fit=crop',
        dessert: 'Crème Brûlée',
        dessertImg: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=400&auto=format&fit=crop'
      }
    },
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 text-left">
          <MenuCard 
            variant="full"
            title="Menu A"
            subtitle="Chef's Signature Selection"
            accentColor="primary"
            appetizer={menuData[activeDay].A.app}
            appetizerImg={menuData[activeDay].A.appImg}
            mainCourse={menuData[activeDay].A.main}
            mainCourseImg={menuData[activeDay].A.mainImg}
            dessert={menuData[activeDay].A.dessert}
            dessertImg={menuData[activeDay].A.dessertImg}
          />

          <MenuCard 
            variant="full"
            title="Menu B"
            subtitle="Ocean & Earth Collection"
            accentColor="secondary"
            appetizer={menuData[activeDay].B.app}
            appetizerImg={menuData[activeDay].B.appImg}
            mainCourse={menuData[activeDay].B.main}
            mainCourseImg={menuData[activeDay].B.mainImg}
            dessert={menuData[activeDay].B.dessert}
            dessertImg={menuData[activeDay].B.dessertImg}
          />
        </div>
        
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
