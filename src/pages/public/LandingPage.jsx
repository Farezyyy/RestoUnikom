import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ReservationModal from '../../components/public/ReservationModal';
import Footer from '../../components/public/Footer';
import DaySelector from '../../components/common/DaySelector';
import MenuCard from '../../components/common/MenuCard';
import useWeeklyMenu, { toMenuCardProps } from '../../data/useWeeklyMenu';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const galleryRef = useRef(null);
  const galleryTrackRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const container = useRef(null);
  useGSAP(() => {
    // Hero Animation
    const tl = gsap.timeline();
    tl.fromTo('.hero-title', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 })
      .fromTo('.hero-subtitle', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }, '-=0.8')
      .fromTo('.hero-btn', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.6');

    // ScrollTrigger Animations for sections
    const sections = gsap.utils.toArray('.fade-up-section');
    sections.forEach(sec => {
      gsap.fromTo(sec,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 80%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    });

    // Gallery GSAP Horizontal Scroll
    if (galleryTrackRef.current && galleryRef.current) {
      const track = galleryTrackRef.current;
      const getScrollAmount = () => track.scrollWidth - window.innerWidth;

      gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: galleryRef.current,
          start: 'center center',
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        }
      });
    }
  }, { scope: container });

  const [activeDay, setActiveDay] = useState('Monday');
  const { week, loading } = useWeeklyMenu();

  return (
    <div ref={container} className="bg-dark text-cream min-h-screen font-sans selection:bg-secondary selection:text-cream overflow-x-hidden smooth-wrapper" data-speed="0.5">
      <nav className="fixed top-0 w-full z-50 glass px-6 md:px-12 py-4 flex flex-col md:flex-row justify-between items-center transition-all duration-300">
        <Link to="/" className="text-2xl font-serif font-bold text-accent tracking-widest uppercase mb-2 md:mb-0">
          Resto Unikom
        </Link>
        <div className="flex items-center space-x-4 md:space-x-6">
          <Link to="/what-is-fine-dining" className="text-sm font-medium tracking-widest uppercase text-cream/70 hover:text-accent transition-colors">
            Philosophy
          </Link>
          <Link to="/menu" className="text-sm font-medium tracking-widest uppercase text-cream/70 hover:text-accent transition-colors">
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

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop" alt="Hero" className="w-full h-full object-cover opacity-50 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/40 to-dark"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center mt-16">
          <h1 className="hero-title text-5xl md:text-8xl font-serif text-cream mb-6 leading-tight tracking-tighter">
            The Art of <br /><span className="text-accent italic font-light">Fine Dining</span>
          </h1>
          <p className="hero-subtitle text-lg md:text-2xl text-cream/80 font-light mb-10 max-w-2xl">
            Experience culinary excellence where every dish tells a story.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="hero-btn px-10 py-4 bg-transparent border border-accent text-accent rounded hover:bg-accent hover:text-dark transition-all duration-500 text-sm md:text-lg uppercase tracking-[0.2em] font-medium">
            Reserve Your Experience
          </button>
        </div>
      </section>

      {/* Introduction */}
      <section className="fade-up-section py-32 px-6 md:px-16 lg:px-24 relative">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-serif text-accent">Symphony of Flavors</h2>
          <div className="w-20 h-px bg-primary mx-auto"></div>
          <p className="text-lg text-cream/70 font-light max-w-3xl mx-auto leading-relaxed">
            At Resto Unikom, we believe that fine dining is more than just a meal—it is an immersive journey. Step into our elegantly designed space, where the ambiance reflects the sophistication of our cuisine.
          </p>
        </div>
      </section>

      {/* About Us */}
      <section className="fade-up-section py-20 px-6 md:px-16 lg:px-24 bg-dark relative border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=2070&auto=format&fit=crop" alt="Chef" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-serif text-accent">About Us</h2>
            <p className="text-cream/70 font-light leading-relaxed">
              Founded on a passion for extraordinary culinary experiences, Resto Unikom brings a fresh perspective to modern fine dining. Our executive chefs work tirelessly to curate menus that highlight the best seasonal produce.
            </p>
            <p className="text-cream/70 font-light leading-relaxed">
              Every detail, from the ambient lighting to the handcrafted tableware, is designed to create a "woah" sensation for our guests.
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Menu */}
      <section className="fade-up-section py-32 px-6 md:px-16 lg:px-24 bg-black/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-accent mb-4">Our Weekly Selection</h2>
            <p className="text-cream/60 font-light">Curated masterpieces, changing every week.</p>
          </div>

          <div className="mb-12">
            <DaySelector activeDay={activeDay} setActiveDay={setActiveDay} variant="public" />
          </div>

          {loading ? (
            <div className="text-center text-cream/60 py-12">Loading this week's menu...</div>
          ) : !week ? (
            <div className="text-center text-cream/60 py-12">Menu unavailable. Please check back soon.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <MenuCard
                title="Menu A"
                {...toMenuCardProps(week[activeDay]?.A)}
              />
              <MenuCard
                title="Menu B"
                {...toMenuCardProps(week[activeDay]?.B)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Image Gallery (GSAP ScrollTrigger Pinned Horizontal Scroll) */}
      <section ref={galleryRef} className="py-24 bg-dark overflow-hidden min-h-screen flex flex-col justify-center">
        <h2 className="text-3xl md:text-4xl font-serif text-center text-accent mb-12">Culinary Gallery</h2>
        <div ref={galleryTrackRef} className="flex gap-8 px-12 w-max items-center">
          {[
            'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop'
          ].map((src, i) => (
            <div key={i} className="w-[320px] md:w-[480px] h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-2xl shrink-0 group relative">
              <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Gallery ${i + 1}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <p className="text-cream font-serif text-lg tracking-wide">Exquisite Presentation</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="fade-up-section py-24 px-6 md:px-16 lg:px-24 relative bg-black/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif text-center text-accent mb-16">What the Critics Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-dark p-8 rounded-xl relative">
                <div className="text-4xl text-primary absolute top-4 left-4 opacity-20">"</div>
                <p className="text-cream/80 italic font-light relative z-10 mb-6">
                  "An absolute triumph of modern gastronomy. The attention to detail is unparalleled, creating a true 'woah' sensation from start to finish."
                </p>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-medium text-accent">Gourmet Magazine</p>
                  <p className="text-xs text-cream/50 uppercase tracking-widest">Food Critic</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors/Brands */}
      <section className="fade-up-section py-16 px-6 border-y border-white/5 bg-dark">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-cream/40 uppercase tracking-widest mb-8">Proudly Partnered With</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Veuve Clicquot', 'San Pellegrino', 'Valrhona', 'Wagyu Co.'].map((brand, i) => (
              <div key={i} className="text-xl font-serif text-cream font-bold tracking-widest">{brand}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6 text-center">
        <h2 className="text-4xl font-serif text-accent mb-8">Ready for an Unforgettable Evening?</h2>
        <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-primary text-cream rounded hover:bg-secondary transition-all duration-300 font-medium tracking-widest uppercase shadow-[0_0_20px_rgba(154,59,59,0.4)]">
          Book Your Table Now
        </button>
      </section>

      <Footer />

      <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
