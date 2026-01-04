
import React from 'react';
import { CartItem } from '../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const subtotal = items.reduce((acc, item) => acc + (item.selectedVariant.price * item.quantity), 0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[80] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 bg-coffee-900 text-white flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold">Your Cart ({items.length})</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-transform hover:rotate-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-lg">Your cart is empty</p>
              <button
                onClick={onClose}
                className="mt-4 text-gold-500 font-bold hover:underline"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-gray-100 pb-4 animate-slide-in-right"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 relative group">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-serif font-bold text-coffee-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.selectedVariant.weight} • {item.roast}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded-sm">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors active:scale-75 transform duration-100"
                        >
                          -
                        </button>
                        <span
                          key={item.quantity}
                          className="px-2 text-sm font-bold w-6 text-center animate-pop"
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors active:scale-75 transform duration-100"
                        >
                          +
                        </button>
                      </div>
                      <span
                        key={item.quantity * item.selectedVariant.price}
                        className="font-bold text-coffee-800 animate-fade-in"
                      >
                        ₹{item.selectedVariant.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-coffee-50 border-t border-coffee-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Subtotal</span>
              <span key={subtotal} className="text-xl font-bold text-coffee-900 animate-pop">₹{subtotal}</span>
            </div>
            {/* <p className="text-xs text-gray-500 mb-4 text-center">Shipping & taxes calculated at checkout</p> */}
            <button
              onClick={onCheckout}
              className="w-full bg-coffee-900 text-white py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-coffee-800 transition-colors hover:shadow-lg transform active:scale-95 duration-200"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};
