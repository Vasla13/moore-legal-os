import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-rajdhani selection:bg-neon-blue selection:text-black overflow-x-hidden">
      {/* --- BACKGROUND IMMERSIF --- */}
      <div className="fixed inset-0 z-0 cyber-grid pointer-events-none" />
      <div className="scanline" />
      
      {/* --- CONTENU --- */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}