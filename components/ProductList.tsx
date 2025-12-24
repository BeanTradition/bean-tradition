
import React, { useState } from 'react';
import { PRODUCTS } from '../constants';
import { Product } from '../types';

interface ProductListProps {
  mode: 'home' | 'shop';
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigateToShop?: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ mode, onProductClick, onAddToCart, onNavigateToShop }) => {
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
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-coffee-900 mt-4 mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 min-h-[400px]">
        {loading ? (
          <div className="col-span-1 md:col-span-3 flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : displayProducts.length > 0 ? (
          displayProducts.map((product, index) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col border border-transparent hover:border-gold-200 transform hover:-translate-y-2"
              onClick={() => handleCardClick(product)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-80 overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>

                {/* Badge */}
                <div className="absolute top-4 left-4 bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-widest text-coffee-900 shadow-sm backdrop-blur-sm rounded-sm">
                  {product.category === 'Beans' ? `${product.roast} Roast` : product.category}
                </div>
              </div>

              <div className="p-8 flex flex-col flex-grow bg-white relative">
                <div className="absolute -top-6 right-8 bg-gold-500 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg text-lg font-bold z-10 group-hover:bg-coffee-900 group-hover:scale-110 transition-all duration-300">
                  {mode === 'home' ? '→' : '+'}
                </div>

                <div className="mb-3">
                  {product.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs text-gold-600 mr-3 font-bold uppercase tracking-wider">{tag}</span>
                  ))}
                </div>

                <h3 className="text-2xl font-serif font-bold text-coffee-900 mb-3 group-hover:text-gold-600 transition-colors duration-300">
                  {product.name}
                </h3>

                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow font-light line-clamp-3">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100 group-hover:border-gold-100 transition-colors">
                  <span className="text-xl font-serif font-bold text-coffee-900">₹{product.variants[0].price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(product);
                    }}
                    className="text-sm font-bold uppercase tracking-widest text-coffee-900 hover:text-gold-600 transition-colors flex items-center gap-2 group/btn"
                  >
                    {mode === 'home' ? 'View Details' : 'Select Size'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
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
