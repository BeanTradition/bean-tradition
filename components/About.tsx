
import React, { useState, useEffect } from 'react';
import { ProducerSection } from './ProducerSection';

interface AboutProps {
  onBack: () => void;
}

const METHODOLOGY_STEPS = [
  {
    id: 0,
    title: "Ethical Sourcing",
    subtitle: "Rooted in Respect",
    description: "We work directly with farmers in the Western Ghats, ensuring fair wages and sustainable practices. Every bean has a traceable lineage.",
    image: "/assets/about_values_1.jpg"
  },
  {
    id: 1,
    title: "Artisan Roasting",
    subtitle: "Mastery of Fire",
    description: "Small batches roasted with obsession. We profile every bean to unlock its hidden potential, balancing acidity and body perfectly.",
    image: "/assets/about_1.jpg"
  },
  {
    id: 2,
    title: "Precision Grinding",
    subtitle: "The Perfect Consistency",
    description: "Burr grinders that shave the bean rather than crushing it, preserving the volatile aromatics that define a great cup.",
    image: "/assets/about_2.jpg"
  },
  {
    id: 3,
    title: "Fresh Extraction",
    subtitle: "The Final Pour",
    description: "The final act. Whether espresso or filter, we provide the guidance and the quality for the perfect golden extraction.",
    image: "/assets/auth_bg.jpg"
  }
];

export const About: React.FC<AboutProps> = ({ onBack }) => {
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (window.innerWidth > 768) {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (clientX / innerWidth) - 0.5,
        y: (clientY / innerHeight) - 0.5
      });
    }
  };

  return (
    <div className="bg-coffee-50 min-h-screen animate-fade-in pb-20 selection:bg-gold-500 selection:text-white" onMouseMove={handleMouseMove}>

      {/* 1. Cinematic Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center bg-black overflow-hidden group">
        <div className="absolute inset-0 opacity-60 transition-transform duration-[20s] ease-linear transform scale-100 animate-zoom-slow">
          <img
            src="/assets/profile_hero.jpg"
            alt="Coffee Story Hero"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-coffee-50"></div>

        {/* Permanent Top-Left Back to Home Button - Adjusted to top-48 to avoid logo overlap */}
        <button
          onClick={onBack}
          className="fixed z-[45] top-48 left-6 md:left-12 inline-flex items-center gap-3 text-white border border-white/40 px-6 py-3 rounded-full transition-all duration-300 backdrop-blur-xl bg-black/60 shadow-2xl hover:scale-105 active:scale-95 group overflow-hidden hover:bg-gold-600 hover:border-gold-500 text-[10px] md:text-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold uppercase tracking-widest whitespace-nowrap">Back to Home</span>
        </button>

        <div className="relative z-10 text-center text-white px-4">
          <div className="w-px h-16 bg-gold-500 mx-auto mb-6 animate-slide-up-reveal"></div>
          <span className="block text-gold-500 font-bold uppercase tracking-[0.5em] text-xs md:text-sm animate-fade-in mb-4">
            Western Ghats
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Origin <span className="italic text-gold-400 font-light">&</span> Soul
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-12 relative z-20 mb-20">
        <div className="bg-white p-10 md:p-12 shadow-2xl max-w-4xl mx-auto text-center border-t-8 border-gold-500 rounded-lg transform transition-transform hover:-translate-y-1 duration-500">
          <div className="text-6xl text-gold-200 font-serif mb-4 leading-none">“</div>
          <p className="text-xl md:text-2xl font-serif text-coffee-900 leading-relaxed italic -mt-6">
            We don't manufacture coffee. We steward it. Directly from the farms to your cup, we merely guide the bean through its destiny.
          </p>
          <div className="mt-8 font-sans font-bold text-gray-400 uppercase tracking-widest text-xs flex items-center justify-center gap-4">
            <span className="h-px w-8 bg-gray-300"></span>
            The Founder's Pledge
            <span className="h-px w-8 bg-gray-300"></span>
          </div>
        </div>
      </div>

      {/* 2. THE METHODOLOGY */}
      <section className="py-20 bg-coffee-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('/assets/stardust.png')] opacity-10"></div>

        {METHODOLOGY_STEPS.map((step) => (
          <div
            key={step.id}
            className={`absolute inset-0 transition-all duration-1000 ease-out-expo pointer-events-none ${activeStep === step.id ? 'opacity-30 scale-100 blur-0' : 'opacity-0 scale-110 blur-sm'}`}
          >
            <img src={step.image} alt="" className="w-full h-full object-cover grayscale mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-r from-coffee-950 via-coffee-950/90 to-coffee-950/40"></div>
          </div>
        ))}

        <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row gap-12 items-center min-h-[500px]">
          <div className="w-full md:w-1/2 space-y-2">
            <div className="mb-10">
              <h2 className="text-gold-500 font-bold uppercase tracking-[0.3em] text-xs mb-4 animate-fade-in">Our Methodology</h2>
              <h3 className="text-3xl md:text-5xl font-serif font-bold text-white">The Pursuit of <br /> Perfection</h3>
            </div>

            <div className="space-y-2">
              {METHODOLOGY_STEPS.map((step) => (
                <div
                  key={step.id}
                  onMouseEnter={() => setActiveStep(step.id)}
                  className={`cursor-pointer group relative pl-6 py-4 transition-all duration-500 border-l-2 ${activeStep === step.id ? 'border-gold-500 bg-white/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                >
                  <div className="flex items-baseline justify-between">
                    <h4 className={`text-xl md:text-2xl font-serif font-bold transition-all duration-300 ${activeStep === step.id ? 'text-white translate-x-2' : 'text-white/40 group-hover:text-white/70'}`}>
                      {step.title}
                    </h4>
                    <span className={`text-xs font-bold uppercase tracking-widest transition-opacity duration-300 ${activeStep === step.id ? 'opacity-100 text-gold-500' : 'opacity-0'}`}>0{step.id + 1}</span>
                  </div>

                  <div className={`overflow-hidden transition-all duration-700 ease-out-expo ${activeStep === step.id ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    <p className="text-gold-500/80 text-[10px] uppercase tracking-widest font-bold mb-2 ml-2">{step.subtitle}</p>
                    <p className="text-gray-300 font-light leading-relaxed max-w-md text-sm ml-2">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/2 relative h-[400px] hidden md:block perspective-1000">
            <div
              className="absolute top-1/2 left-1/2 w-full max-w-sm aspect-[4/5] rounded-sm shadow-2xl border border-white/10 overflow-hidden bg-black"
              style={{
                transform: `translate(-50%, -50%) rotateY(${mousePos.x * 5}deg) rotateX(${mousePos.y * -5}deg)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              {METHODOLOGY_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`absolute inset-0 transition-all duration-700 ease-out transform ${activeStep === step.id ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                >
                  <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="text-6xl font-serif font-bold text-white/10 absolute -top-16 right-0 pointer-events-none select-none">
                      0{step.id + 1}
                    </div>
                    <h5 className="text-white text-xl font-serif font-bold mb-2">{step.title}</h5>
                    <div className="h-0.5 bg-white/20 w-full rounded-full overflow-hidden">
                      <div className="h-full bg-gold-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Parallax Quote Break */}
      <div className="relative h-[40vh] bg-fixed bg-center bg-cover bg-no-repeat flex items-center justify-center" style={{ backgroundImage: "url('/assets/hero_bg.jpg')" }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center px-6">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight drop-shadow-2xl animate-fade-in-up">
            "Coffee is a language <br /> <span className="text-gold-500 italic font-light">in itself.</span>"
          </h2>
        </div>
      </div>

      <div className="py-20 bg-coffee-50 relative">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-serif font-bold text-coffee-900">The Gold Standard</h3>
          <p className="text-gray-500 mt-2 tracking-widest uppercase text-xs">Precision in every grain</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">
          <div className="group relative h-[400px] overflow-hidden rounded-sm shadow-xl cursor-pointer">
            <img src="/assets/aa_grade.jpg" alt="AA Grade" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="w-12 h-1 bg-gold-500 mb-4 group-hover:w-24 transition-all duration-500"></div>
              <h4 className="text-3xl font-serif font-bold text-white mb-2">AA Grade Only</h4>
              <p className="text-white/80 leading-relaxed font-light text-sm">Uniform size ensures even roasting. We strictly select AA-grade beans.</p>
            </div>
            <div className="absolute top-6 right-6 text-white/10 text-8xl font-serif font-bold pointer-events-none group-hover:text-white/20 transition-colors">AA</div>
          </div>

          <div className="group relative h-[400px] overflow-hidden rounded-sm shadow-xl cursor-pointer">
            <img src="/assets/zero_defects.jpg" alt="Zero Defects" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="w-12 h-1 bg-gold-500 mb-4 group-hover:w-24 transition-all duration-500"></div>
              <h4 className="text-3xl font-serif font-bold text-white mb-2">Zero Defects</h4>
              <p className="text-white/80 leading-relaxed font-light text-sm">We optically sort every batch to guarantee zero broken beans.</p>
            </div>
            <div className="absolute top-6 right-6 text-white/10 text-8xl font-serif font-bold pointer-events-none group-hover:text-white/20 transition-colors">0%</div>
          </div>
        </div>
        <ProducerSection />
      </div>
    </div>
  );
};
