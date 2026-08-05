import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="py-12 bg-[#0a0808] text-center border-t border-white/5 mt-auto">
      <p className="text-cream/40 text-sm mb-4">© 2026 Resto Unikom. All rights reserved.</p>
      <Link to="/login" className="text-xs text-primary/50 hover:text-primary transition-colors tracking-widest uppercase">
        Staff Portal
      </Link>
    </footer>
  );
}
