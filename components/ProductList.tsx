
import React, { useState } from 'react';
import { PRODUCTS } from '../constants';
import { Product, CartItem, ProductVariant } from '../types';

interface ProductListProps {
  mode: 'home' | 'shop';
  onProductClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onNavigateToShop?: () => void;
  cart?: CartItem[];
  onQuickAdd?: (product: Product, variant: ProductVariant) => void;
  onUpdateQuantity?: (compositeId: string, delta: number) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ mode, onProductClick, onAddToCart, onNavigateToShop, cart, onQuickAdd, onUpdateQuantity }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Updated Categories based on new product lineup
  const categories = ['All', 'Beans', 'Filter Powder', 'Instant'];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from backend
  React.useEffect(() => {
    import('../services/api').then(({ fetchProducts }) => {
      fetchProducts().then(data => {
        setProducts(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    });
  }, []);

  // Filter Logic
  const sourceProducts = products.length > 0 ? products : []; // Fallback to empty if fetch fails

  const displayProducts = mode === 'home'
    ? sourceProducts.slice(0, 3)
    : (activeCategory === 'All'
      ? sourceProducts
      : sourceProducts.filter(product => product.category === activeCategory)
    );

  const handleCardClick = (product: Product) => {
    if (mode === 'home' && onNavigateToShop) {
      onNavigateToShop();
    } else {
      onProductClick(product);
    }
  };

  return (
    <div id="products-section" className="py-24 container mx-auto px-6">

      {/* 
        Only show the section header in Home mode. 
        In Shop mode, the new Hero Banner handles the title.
      */}
      {mode === 'home' && (
        <div className="text-center mb-12 animate-fade-in-up">
          <span className="text-gold-600 font-bold uppercase tracking-widest text-sm">
            Taste The Legacy
          </span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-coffee-900 mt-4 mb-6">
            Our Collection
          </h2>
          <div className="w-20 h-1 bg-gold-500 mx-auto rounded-full"></div>
        </div>
      )}

      {/* Category Navigation Interface - Only in Shop Mode */}
      {mode === 'shop' && (
        <div className="flex justify-center flex-wrap gap-4 mb-16 animate-fade-in">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 border ${activeCategory === category
                ? 'bg-coffee-900 text-gold-400 border-coffee-900 shadow-lg transform -translate-y-1'
                : 'bg-transparent text-coffee-600 border-coffee-200 hover:border-gold-400 hover:text-gold-600'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-12 min-h-[400px]">
        {loading ? (
          <div className="col-span-2 md:col-span-3 flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : displayProducts.length > 0 ? (
          displayProducts.map((product, index) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col border border-coffee-100 hover:border-gold-200"
              onClick={() => handleCardClick(product)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-44 md:h-80 overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>

                {/* Badge - Smaller on mobile */}
                <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-white/95 px-2 md:px-4 py-1 md:py-2 text-[8px] md:text-xs font-bold uppercase tracking-tighter md:tracking-widest text-coffee-900 shadow-sm backdrop-blur-sm rounded-sm">
                  {product.category === 'Beans' ? `${product.roast} Roast` : (product.category === 'Filter Powder' ? 'Filter' : product.category)}
                </div>
              </div>

              <div className="p-4 md:p-8 flex flex-col flex-grow bg-white relative">
                {/* Floating Action Button / Quantity Control */}
                {mode === 'shop' && cart && onUpdateQuantity ? (
                  (() => {
                    const defaultVariant = product.variants[0];
                    const cartItem = cart.find(item => item.id === product.id && item.selectedVariant.weight === defaultVariant.weight);

                    if (cartItem) {
                      return (
                        <div
                          className="absolute -top-4 right-4 md:-top-6 md:right-8 bg-coffee-900 rounded-full shadow-lg flex items-center border-2 border-white z-10 overflow-hidden h-8 md:h-12 animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onUpdateQuantity(`${product.id}-${defaultVariant.weight}`, -1)}
                            className="w-8 md:w-12 h-full flex items-center justify-center text-white hover:bg-white/20 transition-colors font-bold text-lg pb-1"
                          >
                            -
                          </button>
                          <span className="font-bold text-gold-400 text-sm md:text-base min-w-[1.5rem] text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(`${product.id}-${defaultVariant.weight}`, 1)}
                            className="w-8 md:w-12 h-full flex items-center justify-center text-white hover:bg-white/20 transition-colors font-bold text-lg pb-1"
                          >
                            +
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onQuickAdd) onQuickAdd(product, defaultVariant);
                        }}
                        className="absolute -top-4 right-4 md:-top-6 md:right-8 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-lg text-sm md:text-lg font-bold z-10 transition-all duration-300 bg-gold-500 text-white group-hover:bg-coffee-900 group-hover:scale-110"
                      >
                        +
                      </button>
                    );
                  })()
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateToShop) onNavigateToShop();
                    }}
                    className="absolute -top-4 right-4 md:-top-6 md:right-8 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-lg text-sm md:text-lg font-bold z-10 transition-all duration-300 bg-gold-500 text-white group-hover:bg-coffee-900 group-hover:scale-110"
                  >
                    →
                  </button>
                )}

                <div className="mb-2 hidden md:block">
                  {product.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs text-gold-600 mr-3 font-bold uppercase tracking-wider">{tag}</span>
                  ))}
                </div>

                <h3 className="text-sm md:text-2xl font-serif font-bold text-coffee-900 mb-1 md:mb-3 group-hover:text-gold-600 transition-colors duration-300 line-clamp-1">
                  {product.name}
                </h3>

                <p className="text-gray-500 text-[10px] md:text-sm leading-tight md:leading-relaxed mb-4 md:mb-6 flex-grow font-light line-clamp-2 md:line-clamp-3">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 md:pt-6 border-t border-gray-100 group-hover:border-gold-100 transition-colors">
                  <span className="text-base md:text-xl font-serif font-bold text-coffee-900">₹{product.variants[0].price}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-3 text-center py-20">
            <p className="text-xl text-coffee-400 font-serif italic">No products found in this category.</p>
            <button
              onClick={() => setActiveCategory('All')}
              className="mt-4 text-gold-600 font-bold hover:underline"
            >
              View All Products
            </button>
          </div>
        )}
      </div>

      {mode === 'home' && (
        <div className="text-center mt-16 animate-fade-in">
          <button
            onClick={onNavigateToShop}
            className="inline-block px-12 py-4 border-2 border-coffee-900 text-coffee-900 font-bold uppercase tracking-widest hover:bg-coffee-900 hover:text-gold-400 transition-all duration-300 hover:shadow-xl rounded-sm"
          >
            View Full Collection
          </button>
        </div>
      )}
    </div>
  );
};
