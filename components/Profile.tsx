
import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';

interface ProfileProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onBack, onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    import('../services/api').then(async ({ getMyOrders }) => {
      try {
        const myOrders = await getMyOrders();
        // Backend returns different structure, map it
        const mappedOrders: any[] = myOrders.map((o: any) => ({
          id: o._id || o.id,
          date: new Date(o.created_at).toLocaleDateString(),
          status: o.status,
          total: o.totalPrice,
          // Map backend orderItems to frontend items structure
          items: o.orderItems.map((item: any) => ({
            ...item,
            selectedVariant: {
              weight: item.weight,
              price: item.price
            }
          })),
          customer: o.shippingAddress
        }));
        setOrders(mappedOrders);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    });
  }, [user.email]);

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'Pending': return 33;
      case 'Shipped': return 66;
      case 'Delivered': return 100;
      default: return 0;
    }
  };

  return (
    <div className="bg-coffee-50 min-h-screen animate-fade-in pb-20">
      {/* Hero */}
      <div className="relative h-[50vh] flex items-center justify-center bg-black overflow-hidden group">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
            alt="Profile Hero"
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-coffee-50"></div>

        {/* Permanent Top-Left Back Button */}
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
          <div className="w-px h-16 bg-gold-500 mx-auto mb-6"></div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
            Greetings, <span className="text-gold-400">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-white/60">Member since {user.joinedDate}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Sidebar */}
          <div className="bg-white p-8 rounded-lg shadow-xl border border-coffee-100 h-fit">
            <h2 className="text-xl font-serif font-bold text-coffee-900 mb-6 border-b border-gray-100 pb-4">Personal Details</h2>
            <div className="space-y-4">
              <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Full Name</p><p className="text-coffee-900 font-medium">{user.name}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Email</p><p className="text-coffee-900 font-medium">{user.email}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Phone</p><p className="text-coffee-900 font-medium">{user.phone || 'Not provided'}</p></div>
            </div>
            <button onClick={onLogout} className="mt-10 w-full border border-red-200 text-red-500 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors">Logout Session</button>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-lg shadow-xl border border-coffee-100">
              <h2 className="text-xl font-serif font-bold text-coffee-900 mb-8 flex items-center justify-between">
                <span>Brew History</span>
                <span className="text-xs bg-gold-500 text-white px-3 py-1 rounded-full">{orders.length} Orders</span>
              </h2>
              {orders.length === 0 ? (
                <div className="py-20 text-center text-gray-400 italic font-serif">No past orders found.</div>
              ) : (
                <div className="space-y-12">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-coffee-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8 border-b border-gray-100 pb-4">
                        <div>
                          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase">{order.id}</p>
                          <p className="text-sm font-bold text-coffee-900">{order.date.split(',')[0]}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-1 ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {order.status}
                            </span>
                            <p className="text-lg font-serif font-bold text-coffee-900">₹{order.total}</p>
                          </div>
                        </div>
                      </div>

                      {/* Visual Status Indicator / Progress Tracker COMMENTED OUT
                      <div className="mb-10 px-2">
                        <div className="relative">
                          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-out-expo ${order.status === 'Pending' ? 'bg-yellow-500' :
                                  order.status === 'Shipped' ? 'bg-blue-500' :
                                    'bg-green-500'
                                }`}
                              style={{ width: `${getStatusProgress(order.status)}%` }}
                            />
                          </div>

                          <div className="relative flex justify-between">
                            <div className="flex flex-col items-center">
                              <div className={`w-4 h-4 rounded-full border-2 bg-white transition-colors duration-500 ${order.status !== 'unspecified' ? 'border-green-500 bg-green-500' : 'border-gray-200'}`}></div>
                              <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-coffee-900">Placed</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-4 h-4 rounded-full border-2 bg-white transition-colors duration-500 ${['Shipped', 'Delivered'].includes(order.status) ? 'border-blue-500 bg-blue-500' : 'border-gray-200'}`}></div>
                              <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-coffee-900">Shipped</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-4 h-4 rounded-full border-2 bg-white transition-colors duration-500 ${order.status === 'Delivered' ? 'border-green-500 bg-green-500' : 'border-gray-200'}`}></div>
                              <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-coffee-900">Delivered</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      */}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <img src={item.image} alt="" className="w-10 h-10 rounded-sm object-cover border border-gray-100" />
                              <div className="text-xs">
                                <p className="font-bold text-coffee-800">{item.name}</p>
                                <p className="text-gray-500">{item.selectedVariant.weight} x {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-coffee-50 p-4 rounded border border-coffee-100 text-xs">
                          <p className="font-bold uppercase text-gray-400 tracking-tighter mb-1">Delivering To</p>
                          <p className="text-coffee-900 font-medium">{order.customer.address}</p>
                          <p className="text-coffee-900">{order.customer.city}, {order.customer.pincode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
