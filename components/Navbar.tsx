
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

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/917075852734", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ease-in-out ${isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
          }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent h-48 pointer-events-none" />

        <div className="container mx-auto px-4 py-3 md:py-6 relative flex justify-between items-center">
          <div
            className="flex items-center cursor-pointer group"
            onClick={handleHomeClick}
          >
            <img
              src="/assets/logo.png"
              alt="Bean Tradition Logo"
              className="h-16 md:h-36 w-auto object-contain transform group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-14">
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

            <div className="flex items-center gap-1 sm:gap-6">
              {/* WhatsApp Support */}
              <button
                onClick={handleWhatsAppClick}
                className="group p-2 flex items-center gap-2 text-white/90 hover:text-[#25D366] transition-colors"
                title="Support on WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </button>
              {/* Account Access */}
              <button
                onClick={handleAccountClick}
                className="group p-2 flex items-center gap-2 text-white/90 hover:text-gold-400 transition-colors"
                title={currentUser ? "View Profile" : "Login / Signup"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {currentUser && <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">{currentUser.name.split(' ')[0]}</span>}
              </button>

              {/* Cart */}
              <div className="relative cursor-pointer group p-2" onClick={onOpenCart}>
                <div className="relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover:text-gold-400 transition-colors drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                {cartCount > 0 && (
                  <span className="absolute top-1 right-0 bg-gold-500 text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full animate-bounce font-sans border border-black/20 z-20">
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
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0 pointer-events-none'
          }`}
      >
        <div className="bg-white/95 backdrop-blur-xl border border-coffee-200 shadow-2xl rounded-full px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-3 sm:gap-5 ring-1 ring-coffee-100/50">
          <button onClick={handleHomeClick} className="text-coffee-900 hover:text-gold-600 transition-colors p-1 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <div className="w-px h-4 sm:h-5 bg-coffee-200"></div>

          <button onClick={() => onNavigate(AppView.SHOP)} className="text-coffee-900 hover:text-gold-600 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="hidden sm:inline uppercase text-[10px] font-bold tracking-widest font-sans">Shop</span>
          </button>

          <div className="w-px h-3 bg-coffee-300/50"></div>

          <button onClick={() => onNavigate(AppView.ABOUT)} className="text-coffee-900 hover:text-gold-600 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="hidden sm:inline uppercase text-[10px] font-bold tracking-widest font-sans whitespace-nowrap">Story</span>
          </button>

          <div className="w-px h-3 bg-coffee-300/50"></div>

          <button onClick={handleAccountClick} className="text-coffee-900 hover:text-gold-600 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline uppercase text-[10px] font-bold tracking-widest font-sans">Account</span>
          </button>

          <div className="w-px h-3 bg-coffee-300/50"></div>

          <button
            onClick={handleWhatsAppClick}
            className="text-[#25D366] hover:scale-110 transition-transform p-1 flex items-center justify-center"
            title="WhatsApp Support"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </button>

          <div className="w-px h-4 sm:h-5 bg-coffee-200"></div>

          <div className="relative cursor-pointer group flex items-center px-1" onClick={onOpenCart}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-coffee-900 group-hover:text-gold-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && <span className="absolute -top-1.5 -right-1 bg-gold-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full shadow-sm font-sans">{cartCount}</span>}
          </div>
        </div>
      </div>
    </>
  );
};
