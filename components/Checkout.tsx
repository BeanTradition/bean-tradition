
import React, { useState, useEffect } from 'react';
import { CartItem, UserDetails, Order, User } from '../types';

interface CheckoutProps {
  cart: CartItem[];
  onBack: () => void;
  onSuccess: () => void;
  currentUser: User | null;
}

export const Checkout: React.FC<CheckoutProps> = ({ cart, onBack, onSuccess, currentUser }) => {
  const [formData, setFormData] = useState<UserDetails>({
    name: '', phone: '', email: '', address: '', city: '', pincode: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        phone: currentUser.phone || '',
        email: currentUser.email,
        address: currentUser.address || '',
        city: currentUser.city || '',
        pincode: currentUser.pincode || ''
      });
    }
  }, [currentUser]);

  const subtotal = cart.reduce((acc, item) => acc + (item.selectedVariant.price * item.quantity), 0);
  const shipping = subtotal >= 499 ? 0 : 100;
  const total = subtotal + shipping;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Force Login Check
  useEffect(() => {
    if (!currentUser) {
      alert("Please login to proceed to checkout.");
      onBack();
    }
  }, [currentUser, onBack]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!rzpKey) {
      alert("Razorpay Key ID is missing. Please check your environment variables.");
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    try {
      const { createRazorpayOrder, verifyRazorpayPayment, createOrder } = await import('../services/api');

      console.log("Creating Razorpay order for amount:", total);
      const orderCreationData = await createRazorpayOrder(total);
      console.log("Order created successfully:", orderCreationData);

      const options = {
        key: rzpKey,
        amount: orderCreationData.amount,
        currency: "INR",
        name: "Bean Tradition",
        description: "Premium Coffee Order",
        image: "/assets/logo.png",
        order_id: orderCreationData.id,
        handler: async function (response: any) {
          try {
            const verification = await verifyRazorpayPayment({
              orderCreationId: orderCreationData.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verification.msg === "success") {
              const newOrder = {
                orderItems: cart.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  image: item.image,
                  price: item.selectedVariant.price,
                  weight: item.selectedVariant.weight,
                  product: item._id || item.id
                })),
                shippingAddress: {
                  address: formData.address,
                  city: formData.city,
                  pincode: formData.pincode,
                  country: 'India',
                  phone: formData.phone
                },
                paymentMethod: 'Razorpay',
                itemsPrice: subtotal,
                taxPrice: 0,
                shippingPrice: shipping,
                totalPrice: total,
                paymentResult: {
                  id: response.razorpay_payment_id,
                  status: 'paid',
                  update_time: new Date().toISOString(),
                  email_address: formData.email
                }
              };

              await createOrder(newOrder);
              onSuccess();
            } else {
              alert("Payment verification failed.");
              setIsProcessing(false);
            }
          } catch (error: any) {
            console.error("Payment verification failed", error);
            alert("Payment verification failed.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#8B4513",
          backdrop_color: "rgba(0,0,0,0.85)"
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        remember_customer: true,
        config: {
          display: {
            preferences: {
              show_default_blocks: true,
            }
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Checkout modal closed");
            // Small delay to ensure state update follows modal animation
            setTimeout(() => setIsProcessing(false), 200);
          },
          backdropclose: false,
          escape: true
        }
      };

      // @ts-ignore
      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        console.error("Payment failed", response.error);
        alert(`Payment Failed: ${response.error.description || "Something went wrong"}`);
        setIsProcessing(false);
      });
      rzp1.open();

    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong processing order.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-50 py-12 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <button onClick={onBack} className="text-coffee-700 font-bold mb-6 flex items-center hover:underline">
            ← Back to Shop
          </button>
          <h2 className="text-3xl font-serif font-bold text-coffee-900 mb-8">Checkout</h2>

          <form onSubmit={handlePayment} className="space-y-6 bg-white p-8 shadow-sm rounded-sm border border-coffee-100">
            <h3 className="text-lg font-bold uppercase tracking-wider text-coffee-800 border-b border-gray-100 pb-2 mb-4">
              Contact & Shipping
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input required name="name" type="text" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input required name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email Address</label>
              <input required name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              <textarea required name="address" rows={3} value={formData.address} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <input required name="city" type="text" value={formData.city} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pincode</label>
                <input required name="pincode" type="text" value={formData.pincode} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none" />
              </div>
            </div>

            <button type="submit" disabled={isProcessing} className={`w-full bg-gold-500 text-white py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-gold-600 transition-all mt-6 flex justify-center items-center shadow-lg transform hover:-translate-y-0.5 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isProcessing ? 'Processing...' : `Pay ₹${total}`}
            </button>
          </form>
        </div>

        <div className="bg-white p-8 shadow-sm rounded-sm h-fit sticky top-24 border border-coffee-100">
          <h3 className="text-lg font-bold uppercase tracking-wider text-coffee-800 border-b border-gray-100 pb-2 mb-4">Summary</h3>
          <div className="space-y-4 mb-6">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-sm" />
                  <div>
                    <span className="text-coffee-900 font-medium block">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.selectedVariant.weight} x {item.quantity}</span>
                  </div>
                </div>
                <span className="text-coffee-900 font-bold">₹{item.selectedVariant.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
            {shipping > 0 && (
              <p className="text-[10px] text-gold-600 font-bold text-right italic">+ Add ₹{499 - subtotal} more for Free Delivery</p>
            )}
          </div>
          <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
            <span className="font-serif font-bold text-xl text-coffee-900">Total</span>
            <span className="font-serif font-bold text-xl text-coffee-900">₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
