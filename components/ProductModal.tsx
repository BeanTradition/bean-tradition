
import React, { useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedVariantIndex(0);
      setIsAdded(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      selectedVariant: product.variants[selectedVariantIndex],
      quantity: 1
    });
    setIsAdded(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-coffee-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white rounded-full text-coffee-900 transition-colors backdrop-blur-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-full md:w-1/2 h-80 md:h-auto bg-gray-100 relative">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent">
             <div className="flex gap-2 text-white/90">
                {product.tags.map(tag => (
                   <span key={tag} className="text-xs border border-white/40 px-2 py-1 rounded-sm uppercase tracking-wide">{tag}</span>
                ))}
             </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white max-h-[90vh] overflow-y-auto min-h-[500px]">
          {isAdded ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-3xl font-serif font-bold text-coffee-900 mb-2">Excellent Choice</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
                  You've added <span className="text-coffee-900 font-bold">{product.name}</span> to your brewing kit.
                </p>
                <button 
                  onClick={onClose}
                  className="bg-coffee-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all hover:shadow-xl transform hover:-translate-y-1"
                >
                  Continue Shopping
                </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-block px-4 py-1 bg-coffee-100 text-coffee-800 text-xs font-bold uppercase tracking-widest rounded-full">
                  {product.roast} Roast
                </span>
                <div className="flex flex-col items-end">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-2 w-2 rounded-full ${i < product.intensity ? 'bg-gold-500' : 'bg-gray-200'}`}></div>
                      ))}
                    </div>
                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Intensity</span>
                </div>
              </div>

              <h2 className="text-3xl md:text-5xl font-serif font-bold text-coffee-900 mb-4 leading-tight">
                {product.name}
              </h2>
              
              <p className="text-coffee-700 text-base md:text-lg leading-relaxed mb-8 font-light">
                {product.description}
              </p>

              <div className="mb-8">
                <label className="block text-sm font-bold text-coffee-900 uppercase tracking-widest mb-3">Select Size</label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`px-6 py-3 border rounded-sm transition-all duration-300 ${
                        selectedVariantIndex === idx 
                          ? 'border-gold-500 bg-coffee-900 text-white shadow-lg' 
                          : 'border-coffee-200 text-coffee-800 hover:border-gold-400'
                      }`}
                    >
                      <span className="block text-sm font-bold">{variant.weight}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-coffee-50 p-3 rounded-lg border border-coffee-100 text-center">
                  <span className="block text-xs text-gray-500 uppercase tracking-widest mb-1">Flavor Profile</span>
                  <span className="font-serif font-bold text-base text-coffee-900">{product.tastingNotes}</span>
                </div>
                <div className="bg-coffee-50 p-3 rounded-lg border border-coffee-100 text-center">
                  <span className="block text-xs text-gray-500 uppercase tracking-widest mb-1">Best For</span>
                  <span className="font-serif font-bold text-base text-coffee-900">{product.bestFor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-8 border-t border-gray-100">
                <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Price</span>
                    <div className="text-3xl font-serif font-bold text-coffee-900">
                    ₹{product.variants[selectedVariantIndex].price}
                    </div>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="bg-coffee-900 text-white px-8 md:px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all hover:shadow-xl transform hover:-translate-y-1"
                >
                  Add to Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
