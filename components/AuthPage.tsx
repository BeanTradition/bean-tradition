
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthPageProps {
  onBack: () => void;
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'reset';
  resetToken?: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onLogin, initialMode = 'login', resetToken = '' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { login, register, forgotPassword, resetPassword } = await import('../services/api');

      if (mode === 'login') {
        const user = await login(formData.email, formData.password);
        onLogin(user);
      } else if (mode === 'signup') {
        const user = await register(formData.name, formData.email, formData.password, formData.phone);
        onLogin(user);
      } else if (mode === 'forgot') {
        await forgotPassword(formData.email);
        setMessage('Reset link sent to your email. Please check your inbox.');
      } else if (mode === 'reset') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const user = await resetPassword(resetToken, formData.password);
        setMessage('Password reset successful! Logging you in...');
        setTimeout(() => onLogin(user), 2000);
      }

    } catch (err: any) {
      console.error("Auth Error", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Authentication failed. Please check connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Access';
      case 'reset': return 'New Password';
      default: return 'Welcome Back';
    }
  };

  return (
    <div className="bg-coffee-50 min-h-screen animate-fade-in pb-20 selection:bg-gold-500 selection:text-white">
      <div className="relative h-[60vh] flex items-center justify-center bg-black overflow-hidden group">
        <div className="absolute inset-0 opacity-60">
          <img
            src="/assets/auth_bg.jpg"
            alt="Coffee Background"
            className="w-full h-full object-cover grayscale animate-zoom-slow"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-coffee-50"></div>

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
            {getTitle()}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-20 relative z-20">
        <div className="bg-white p-8 md:p-12 shadow-2xl max-w-lg mx-auto rounded-lg border-t-8 border-gold-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
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

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                <input required type="email" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none bg-transparent text-coffee-900" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <input required type="password" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none bg-transparent text-coffee-900" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Confirm New Password</label>
                <input required type="password" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none bg-transparent text-coffee-900" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
              </div>
            )}

            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded border-l-4 border-red-500">{error}</p>}
            {message && <p className="text-green-600 text-xs font-bold bg-green-50 p-3 rounded border-l-4 border-green-500 leading-relaxed">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-900 text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (
                mode === 'login' ? 'Login' :
                  mode === 'signup' ? 'Sign Up' :
                    mode === 'forgot' ? 'Send Reset Link' : 'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('signup')} className="text-gray-500 hover:text-gold-500 text-sm font-medium transition-colors">Don't have an account? Sign Up</button>
                <button onClick={() => setMode('forgot')} className="text-gold-600 hover:text-gold-700 text-xs font-bold uppercase tracking-wider transition-colors pt-2">Forgot Password?</button>
              </>
            )}
            {mode === 'signup' && (
              <button onClick={() => setMode('login')} className="text-gray-500 hover:text-gold-500 text-sm font-medium transition-colors">Already have an account? Login</button>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="text-gray-500 hover:text-gold-500 text-sm font-medium transition-colors">Back to Login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
