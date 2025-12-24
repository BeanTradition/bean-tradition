import React, { useState } from 'react';
import { getCoffeeRecommendation } from '../services/geminiService';
import { PRODUCTS } from '../constants';

export const AIBarista: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [preference, setPreference] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preference.trim()) return;

    setLoading(true);
    setRecommendation('');
    const result = await getCoffeeRecommendation(preference, PRODUCTS);
    setRecommendation(result);
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-coffee-800 text-white rounded-full p-4 shadow-lg hover:bg-coffee-700 transition-all hover:scale-110 flex items-center gap-2 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <span className="text-xl">🤖</span>
        <span className="font-bold text-sm hidden md:inline">Ask Caffeine Ai</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white rounded-lg shadow-2xl border border-coffee-100 flex flex-col overflow-hidden animate-fadeIn">
          <div className="bg-coffee-800 p-4 flex justify-between items-center text-white">
            <h3 className="font-serif font-bold flex items-center gap-2">
              <span className="text-2xl">☕</span> Caffeine Ai
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300">✕</button>
          </div>
          
          <div className="p-4 flex-grow max-h-[400px] overflow-y-auto bg-coffee-50">
            {recommendation ? (
               <div className="bg-white p-4 rounded-lg shadow-sm border border-coffee-100 text-coffee-800 text-sm leading-relaxed">
                 <p className="font-bold mb-2">Here is my pick for you:</p>
                 <p>{recommendation}</p>
                 <button 
                   onClick={() => { setRecommendation(''); setPreference(''); }}
                   className="mt-4 text-xs text-gold-600 font-bold hover:underline"
                 >
                   Ask again
                 </button>
               </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="mb-2">Not sure what to buy?</p>
                <p className="text-xs">Tell Caffeine Ai what you like (e.g., "fruity", "dark chocolate", "strong morning kick")</p>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse flex space-x-2">
                  <div className="w-2 h-2 bg-coffee-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-coffee-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-coffee-600 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          {!recommendation && (
            <form onSubmit={handleAsk} className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  placeholder="I like sweet & creamy..."
                  className="flex-grow border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-gold-500"
                  disabled={loading}
                />
                <button 
                  type="submit"
                  disabled={loading || !preference}
                  className="bg-gold-500 text-white px-3 py-2 rounded-md font-bold text-sm hover:bg-gold-600 disabled:opacity-50"
                >
                  Ask
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
};