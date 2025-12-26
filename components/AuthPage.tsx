
import React, { useState } from 'react';
import { User } from '../types';
import { GoogleLogin } from '@react-oauth/google';

interface AuthPageProps {
  onBack: () => void;
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { login, register } = await import('../services/api');

      let user;
      if (isLogin) {
        user = await login(formData.email, formData.password);
      } else {
        user = await register(formData.name, formData.email, formData.password, formData.phone);
      }

      // Success
      onLogin(user);

    } catch (err: any) {
      console.error("Auth Error", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Authentication failed. Please check connection.');
      }
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    try {
      const { googleLogin } = await import('../services/api');
      const user = await googleLogin(response.credential);
      onLogin(user);
    } catch (err: any) {
      console.error("Google Auth Error", err);
      setError('Google Login failed.');
    }
  };

  return (
    <div className="bg-coffee-50 min-h-screen animate-fade-in pb-20 selection:bg-gold-500 selection:text-white">
      {/* Cinematic Hero */}
      <div className="relative h-[60vh] flex items-center justify-center bg-black overflow-hidden group">
        <div className="absolute inset-0 opacity-60">
          <img
            src="/assets/auth_bg.jpg"
            alt="Coffee Background"
            className="w-full h-full object-cover grayscale animate-zoom-slow"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-coffee-50"></div>

        {/* Permanent Top-Left Back Button - Adjusted to top-48 to avoid logo overlap */}
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
            Customer Portal
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
        </div>
      </div>

      {/* Auth Card */}
      <div className="container mx-auto px-6 -mt-20 relative z-20">
        <div className="bg-white p-8 md:p-12 shadow-2xl max-w-lg mx-auto rounded-lg border-t-8 border-gold-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                  <input required type="text" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none bg-transparent text-coffee-900" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Phone</label>
                  <input required type="tel" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none bg-transparent text-coffee-900" placeholder="+91 00000 00000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
              <input required type="email" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none bg-transparent text-coffee-900" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
              <input required type="password" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none bg-transparent text-coffee-900" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button type="submit" className="w-full bg-coffee-900 text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all shadow-lg transform hover:-translate-y-1">{isLogin ? 'Login' : 'Sign Up'}</button>

            {/* 
            <div className="flex items-center gap-4 my-6">
              <div className="flex-grow h-px bg-gray-200"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or continue with</span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                useOneTap
                theme="outline"
                shape="pill"
                width="100%"
              />
            </div>
            */}
          </form>
          <div className="mt-8 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-gray-500 hover:text-gold-500 text-sm font-medium transition-colors">{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
