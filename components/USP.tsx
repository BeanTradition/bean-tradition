
import React, { useState } from 'react';
import { USP_DATA } from '../constants';

export const USP: React.FC = () => {
  const [activeIndices, setActiveIndices] = useState<number[]>([0, 1, 2]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-coffee-950 py-24 relative overflow-hidden">
      {/* Section Header */}
      <div className="container mx-auto px-6 mb-16 relative z-10 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-gold-500 font-bold uppercase tracking-[0.3em] text-xs block mb-3 animate-fade-in">
              Why We Are Different
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
              The Artisan <br /><span className="text-coffee-300 italic">Covenant</span>
            </h2>
          </div>
          <p className="text-white/70 max-w-2xl text-xl md:text-3xl font-light leading-snug">
            We don't just sell coffee; we curate an experience. From the farms to your morning cup, every step is a promise of perfection.
          </p>
        </div>
      </div>

      {/* Cinematic Accordion */}
      <div className="w-full h-[600px] md:h-[700px] flex flex-col md:flex-row">
        {USP_DATA.map((item, index) => {
          // Determine if this item is currently active (expanded)
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
              className={`
                relative h-full transition-all duration-700 ease-out-expo overflow-hidden group cursor-pointer border-b md:border-b-0 md:border-r border-white/10
                flex-[1] md:flex-[3] grayscale-0 opacity-100
                ${isAnyHovered && !isHovered ? 'md:flex-[1] md:opacity-60 md:grayscale' : ''}
                ${!isAnyHovered ? 'flex-[1]' : ''}
                ${isHovered ? 'flex-[2] md:flex-[3]' : 'flex-[1]'}
              `}
            >
              {/* Background Image with Zoom Effect */}
              <div className="absolute inset-0 bg-black">
                <img
                  src={item.image}
                  alt={item.title}
                  className={`
                    w-full h-full object-cover transition-transform duration-1000 ease-out-expo
                    ${isHovered ? 'scale-110' : 'scale-100'}
                  `}
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 md:via-black/40 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-95' : 'opacity-80 md:opacity-70'}`}></div>
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end z-20">
                {/* Number Watermark */}
                <div className="absolute top-6 md:top-8 right-6 md:right-8 text-6xl md:text-8xl font-serif font-bold text-white/5 select-none pointer-events-none transition-transform duration-700 transform group-hover:-translate-y-4">
                  0{index + 1}
                </div>

                <div className={`transition-all duration-500 transform ${isHovered ? 'translate-y-0' : 'translate-y-2 md:translate-y-4'}`}>
                  <div className="w-8 md:w-12 h-1 bg-gold-500 mb-4 md:mb-6 transition-all duration-500 group-hover:w-24"></div>

                  <h3 className="text-xl md:text-4xl font-serif font-bold text-white mb-2 md:mb-4 group-hover:text-gold-400 transition-colors">
                    {item.title}
                  </h3>

                  <div className={`
                    overflow-hidden transition-all duration-700 ease-out-expo
                    ${isHovered ? 'max-h-48 opacity-100 mt-0' : 'max-h-0 opacity-0'} 
                  `}>
                    <p className="text-coffee-100 text-sm md:text-lg font-light leading-relaxed max-w-xl">
                      {item.description}
                    </p>
                  </div>

                  {/* "Explore" Indicator only visible when NOT hovered to encourage interaction */}
                  <div className={`mt-2 transition-opacity duration-300 ${!isHovered ? 'opacity-100' : 'opacity-0 h-0'}`}>
                    <span className="text-gold-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      {window.innerWidth < 768 ? 'Tap to Reveal' : 'Hover to Explore'}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decorative Bottom Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-coffee-900 via-gold-600 to-coffee-900"></div>
    </div>
  );
};
