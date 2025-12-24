
import React from 'react';

interface HeroProps {
  onShopNow: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopNow }) => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* 
        ------------------------------------------------------------
        BACKGROUND 
        ------------------------------------------------------------
      */}
      <div className="absolute inset-0 bg-black">
        <img
          src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
          alt="Coffee Beans Roasting"
          className="w-full h-full object-cover opacity-60 animate-zoom-slow"
        />
        {/* Vignette Overlay for focus */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90"></div>
        {/* Gradient Overlay for atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-coffee-950/90"></div>
      </div>

      {/* 
        ------------------------------------------------------------
        UNIQUE EFFECT: FLOATING EMBERS / GOLD DUST
        ------------------------------------------------------------
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold-400 blur-[1px] opacity-0 animate-float"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 50 + 50 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          ></div>
        ))}
      </div>

      <div id="hero-content" className="relative z-10 text-center text-white px-4 max-w-7xl pt-20">

        {/* Masked Reveal for Subtitle */}
        <div className="overflow-hidden mb-4">
          <div className="animate-slide-up-reveal" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl md:text-3xl font-light tracking-[0.4em] uppercase text-gold-400">
              Direct from Farms
            </h2>
          </div>
        </div>

        {/* Masked Reveal for Main Title */}
        <div className="overflow-hidden mb-8 py-2">
          <div className="animate-slide-up-reveal" style={{ animationDelay: '0.4s' }}>
            <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-serif font-bold leading-none drop-shadow-2xl">
              Bean <span className="italic font-light text-coffee-100">Tradition</span>
            </h1>
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <p className="text-lg md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-light leading-relaxed drop-shadow-md">
            Discover the rich aroma and exquisite taste of our premium coffee beans, directly from the farms. We offer a range of Arabica, Robusta blends and Instant mix, freshly roasted to perfection.
          </p>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <button
            onClick={onShopNow}
            className="group relative px-14 py-6 bg-transparent border-2 border-white/20 text-white font-bold uppercase tracking-widest text-lg overflow-hidden transition-all duration-500 hover:border-gold-500"
          >
            <div className="absolute inset-0 w-0 bg-gold-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-90"></div>
            <span className="relative z-10 group-hover:text-white transition-colors">Explore Collection</span>
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce opacity-70">
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  );
};
