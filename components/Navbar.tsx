
import React, { useState, useEffect } from 'react';
import { AppView, User } from '../types';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigate: (view: AppView) => void;
  currentUser: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart, onNavigate, currentUser }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = () => {
    onNavigate(AppView.HOME);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAccountClick = () => {
    if (currentUser) {
      onNavigate(AppView.PROFILE);
    } else {
      onNavigate(AppView.AUTH);
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ease-in-out ${
          isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent h-48 pointer-events-none" />

        <div className="container mx-auto px-8 py-6 relative flex justify-between items-center">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={handleHomeClick}
          >
            <img 
              src="https://image2url.com/images/1765869638860-a2498fc6-a31d-440d-add1-e20fe0269835.png" 
              alt="Bean Tradition Logo" 
              className="h-28 md:h-36 w-auto object-contain transform group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
            />
          </div>
          
          <div className="flex items-center gap-10 md:gap-14">
            <button 
              onClick={() => onNavigate(AppView.SHOP)}
              className="hidden md:block text-white/95 hover:text-gold-400 transition-colors text-lg font-serif italic tracking-wider relative group"
            >
              Shop
              <span className="absolute -bottom-2 left-1/2 w-0 h-px bg-gold-400 transition-all group-hover:w-full group-hover:left-0 duration-500 ease-out"></span>
            </button>
            <button 
              onClick={() => onNavigate(AppView.ABOUT)}
              className="hidden md:block text-white/95 hover:text-gold-400 transition-colors text-lg font-serif italic tracking-wider relative group"
            >
              Our Story
              <span className="absolute -bottom-2 left-1/2 w-0 h-px bg-gold-400 transition-all group-hover:w-full group-hover:left-0 duration-500 ease-out"></span>
            </button>
            
            <div className="flex items-center gap-6">
              {/* Account Access */}
              <button 
                onClick={handleAccountClick}
                className="group p-2 flex items-center gap-2 text-white/90 hover:text-gold-400 transition-colors"
                title={currentUser ? "View Profile" : "Login / Signup"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {currentUser && <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">{currentUser.name.split(' ')[0]}</span>}
              </button>

              {/* Cart */}
              <div className="relative cursor-pointer group p-2" onClick={onOpenCart}>
                <div className="relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white group-hover:text-gold-400 transition-colors drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                {cartCount > 0 && (
                  <span className="absolute top-1 right-0 bg-gold-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce font-sans border border-black/20 z-20">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* State 2: Capsule Menu */}
      <div 
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
          isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl border border-coffee-200 shadow-2xl rounded-full px-6 py-3 flex items-center gap-5 ring-1 ring-coffee-100/50">
          <button onClick={handleHomeClick} className="text-coffee-900 hover:text-gold-600 transition-colors p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></button>
          <div className="w-px h-5 bg-coffee-200"></div>
          <button onClick={() => onNavigate(AppView.SHOP)} className="text-coffee-900 hover:text-gold-600 transition-colors uppercase text-[10px] font-bold tracking-widest font-sans">Shop</button>
          <div className="w-px h-3 bg-coffee-300/50"></div>
          <button onClick={() => onNavigate(AppView.ABOUT)} className="text-coffee-900 hover:text-gold-600 transition-colors uppercase text-[10px] font-bold tracking-widest font-sans whitespace-nowrap">Story</button>
          <div className="w-px h-3 bg-coffee-300/50"></div>
          <button onClick={handleAccountClick} className="text-coffee-900 hover:text-gold-600 transition-colors uppercase text-[10px] font-bold tracking-widest font-sans">Account</button>
          <div className="w-px h-5 bg-coffee-200"></div>
          <div className="relative cursor-pointer group flex items-center" onClick={onOpenCart}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-coffee-900 group-hover:text-gold-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm font-sans">{cartCount}</span>}
          </div>
        </div>
      </div>
    </>
  );
};
