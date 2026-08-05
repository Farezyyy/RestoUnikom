import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import ReservationModal from '../../components/public/ReservationModal';
import Footer from '../../components/public/Footer';

export default function FineDiningInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    gsap.fromTo('.content-fade', 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out' }
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
          <Link to="/what-is-fine-dining" className="text-sm font-medium tracking-widest uppercase text-accent transition-colors border-b border-accent pb-1">
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="content-fade mb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-serif text-accent mb-6">What is Fine Dining?</h1>
          <div className="w-20 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-cream/70 font-light max-w-2xl mx-auto">
            A journey beyond sustenance, where every element is orchestrated to perfection.
          </p>
        </div>

        <div className="space-y-16">
          <div className="content-fade flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-serif text-primary mb-4">The Culinary Art</h2>
              <p className="text-cream/80 font-light leading-relaxed">
                Fine dining is not simply eating; it is an exploration of flavor, texture, and visual artistry. Our chefs spend hours perfecting a single dish, ensuring that each ingredient sings in harmony. It's about precision, creativity, and honoring the produce.
              </p>
            </div>
            <div className="md:w-1/2 h-[300px] w-full rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Culinary Art" />
            </div>
          </div>

          <div className="content-fade flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-serif text-primary mb-4">The Atmosphere</h2>
              <p className="text-cream/80 font-light leading-relaxed">
                From the moment you walk through our doors, the ambiance is curated to put you at ease while stimulating your senses. The lighting, the acoustics, and the elegantly dressed tables all contribute to a sense of occasion.
              </p>
            </div>
            <div className="md:w-1/2 h-[300px] w-full rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Atmosphere" />
            </div>
          </div>

          <div className="content-fade flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-serif text-primary mb-4">The Service</h2>
              <p className="text-cream/80 font-light leading-relaxed">
                Impeccable service is the hallmark of fine dining. Our staff are trained to anticipate your needs before you even realize them yourself. It is a delicate dance of attentiveness without intrusion, ensuring your experience is flawless.
              </p>
            </div>
            <div className="md:w-1/2 h-[300px] w-full rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Service" />
            </div>
          </div>
        </div>

        <div className="content-fade mt-32 text-center border-t border-white/10 pt-16">
          <h3 className="text-3xl font-serif text-accent mb-6">Experience It Yourself</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-10 py-4 bg-primary text-cream rounded hover:bg-secondary transition-all duration-300 font-medium tracking-widest uppercase shadow-[0_0_20px_rgba(154,59,59,0.4)]"
          >
            Reserve Your Table
          </button>
        </div>
      </div>

      <Footer />

      <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
