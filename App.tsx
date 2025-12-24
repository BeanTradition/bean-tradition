
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { USP } from './components/USP';
import { ProductList } from './components/ProductList';
import { ProductModal } from './components/ProductModal';
import { CartSidebar } from './components/CartSidebar';
import { Checkout } from './components/Checkout';
import { About } from './components/About';
import { ProducerSection } from './components/ProducerSection';
import { AuthPage } from './components/AuthPage';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { Product, CartItem, AppView, User } from './types';

function App() {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for active session
    const savedSession = localStorage.getItem('kaapi_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('kaapi_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kaapi_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('kaapi_session', JSON.stringify(user));
    setView(AppView.HOME);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kaapi_session');
    setView(AppView.HOME);
  };

  const addToCart = (newItem: CartItem) => {
    setCart(prev => {
      const existing = prev.find(item =>
        item.id === newItem.id && item.selectedVariant.weight === newItem.selectedVariant.weight
      );
      if (existing) {
        return prev.map(item =>
          (item.id === newItem.id && item.selectedVariant.weight === newItem.selectedVariant.weight)
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const updateQuantityComposite = (compositeId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      const key = `${item.id}-${item.selectedVariant.weight}`;
      if (key === compositeId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }

  const removeItemComposite = (compositeId: string) => {
    setCart(prev => prev.filter(item => `${item.id}-${item.selectedVariant.weight}` !== compositeId));
  }

  const handleCheckoutSuccess = () => {
    setView(AppView.SUCCESS);
    setCart([]);
    localStorage.removeItem('kaapi_cart');
  };

  const Footer = () => (
    <footer className="bg-coffee-950 text-coffee-200 py-12 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4 text-gold-400">Bean Tradition</h2>
        <p className="mb-6 opacity-70">Premium Coffee Beans • Sourced from the farms</p>
        <div className="flex justify-center gap-6 text-sm uppercase tracking-widest opacity-60 items-center">
          <a href="mailto:beantradition@gmail.com" className="hover:text-gold-400 transition-colors">Email</a>
          <a href="https://www.instagram.com/beantradition/" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400 transition-colors">Instagram</a>
          <a href="https://wa.me/919985802734" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400 transition-colors flex items-center gap-1">
            <span>+91-9985802734</span>
          </a>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center gap-2">
          <p className="text-xs opacity-40">© 2026 Bean Tradition. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  const renderView = () => {
    if (view === AppView.AUTH) {
      return <AuthPage onBack={() => setView(AppView.HOME)} onLogin={handleLogin} />;
    }

    if (view === AppView.ADMIN && currentUser?.isAdmin) {
      return <AdminDashboard onBack={() => setView(AppView.HOME)} onLogout={handleLogout} />;
    }

    if (view === AppView.PROFILE && currentUser) {
      if (currentUser.isAdmin) {
        setView(AppView.ADMIN); // Auto redirect if admin accesses profile
        return null;
      }
      return (
        <div className="bg-coffee-50 min-h-screen flex flex-col">
          <Profile user={currentUser} onBack={() => setView(AppView.HOME)} onLogout={handleLogout} />
          <Footer />
        </div>
      );
    }

    if (view === AppView.CHECKOUT) {
      return (
        <div className="pt-28">
          <Checkout cart={cart} onBack={() => setView(AppView.HOME)} onSuccess={handleCheckoutSuccess} currentUser={currentUser} />
        </div>
      );
    }

    if (view === AppView.ABOUT) {
      return (
        <div className="bg-coffee-50 min-h-screen flex flex-col">
          <About onBack={() => setView(AppView.HOME)} />
          <Footer />
        </div>
      );
    }

    if (view === AppView.SUCCESS) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-coffee-50 text-center px-4 pt-20">
          <div className="bg-white p-12 rounded-lg shadow-xl max-w-lg animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-serif font-bold text-coffee-900 mb-4">Order Confirmed!</h2>
            <p className="text-gray-600 mb-8">Thank you for choosing Bean Tradition. Order placed successfully.</p>
            <button onClick={() => setView(AppView.HOME)} className="bg-coffee-900 text-white px-6 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-coffee-800 transition-colors">Continue Shopping</button>
          </div>
        </div>
      );
    }

    if (view === AppView.SHOP) {
      return (
        <div className="bg-coffee-50 min-h-screen flex flex-col animate-fade-in">
          <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-coffee-900">
              <img src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80" alt="Shop Hero" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-coffee-900/80 via-transparent to-black/50"></div>
            </div>
            {/* Permanent Top-Left Back Button - Adjusted to top-48 to avoid logo overlap */}
            <button
              onClick={() => setView(AppView.HOME)}
              className="fixed z-[45] top-48 left-6 md:left-12 inline-flex items-center gap-3 text-white border border-white/40 px-6 py-3 rounded-full transition-all duration-300 backdrop-blur-xl bg-black/60 shadow-2xl hover:scale-105 active:scale-95 group overflow-hidden hover:bg-gold-600 hover:border-gold-500 text-[10px] md:text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="font-bold uppercase tracking-widest whitespace-nowrap">Back to Home</span>
            </button>
            <div className="relative z-10 text-center px-4">
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-2 shadow-sm">Our Collection</h1>
              <p className="text-gold-400 font-light tracking-widest uppercase text-sm">Roast • Grind • Brew</p>
            </div>
          </div>
          <div className="flex-grow">
            <ProductList mode="shop" onProductClick={(p) => { setSelectedProduct(p); setIsModalOpen(true); }} onAddToCart={(p) => { setSelectedProduct(p); setIsModalOpen(true); }} />
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div className="bg-coffee-50 min-h-screen flex flex-col">
        <Hero onShopNow={() => setView(AppView.SHOP)} />
        <USP />
        <ProductList mode="home" onProductClick={() => { }} onAddToCart={() => { }} onNavigateToShop={() => setView(AppView.SHOP)} />
        <ProducerSection />
        <Footer />
      </div>
    );
  };

  return (
    <>
      <Navbar cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} onNavigate={setView} currentUser={currentUser} />
      {renderView()}
      <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddToCart={addToCart} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart.map(c => ({ ...c, id: `${c.id}-${c.selectedVariant.weight}` }))} onUpdateQuantity={updateQuantityComposite} onRemoveItem={removeItemComposite} onCheckout={() => { setIsCartOpen(false); setView(AppView.CHECKOUT); }} />
    </>
  );
}

export default App;
