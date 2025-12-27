
import React, { useState } from 'react';

export const ProducerSection: React.FC = () => {
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleQuerySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const queryData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            type: formData.get('type') as string,
            message: formData.get('message') as string,
        };

        setFormStatus('sending');
        try {
            const { sendQuery } = await import('../services/api');
            await sendQuery(queryData);
            setFormStatus('sent');
        } catch (error) {
            console.error("Failed to send query", error);
            alert("Failed to send message. Please try again later.");
            setFormStatus('idle');
        }
    };

    return (
        <section className="py-24 bg-coffee-50 relative overflow-hidden">
            {/* Background Decor Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>

            <div className="container mx-auto px-6 relative z-20">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-coffee-100 max-w-6xl mx-auto">

                    {/* Left: Brand / Info */}
                    <div className="w-full md:w-5/12 bg-coffee-900 text-white p-12 md:p-16 relative overflow-hidden flex flex-col justify-between group">
                        <div className="absolute inset-0 bg-[url('/assets/wood_pattern.png')] opacity-10"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-1000"></div>

                        <div className="relative z-10">
                            <h3 className="text-3xl md:text-4xl font-serif font-bold mb-6">Start Your Journey</h3>
                            <p className="text-coffee-200 mb-10 font-light leading-relaxed">
                                Whether you're a cafe owner looking for the perfect AA-grade roast, or a connoisseur seeking the finest beans, we are here to craft your experience.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Email Us</h4>
                                        <a href="mailto:beantradition@gmail.com" className="text-coffee-300 hover:text-gold-400 transition-colors">beantradition@gmail.com</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">WhatsApp</h4>
                                        <a href="https://wa.me/919985802734" target="_blank" rel="noreferrer" className="text-coffee-300 hover:text-gold-400 transition-colors">+91 99858 02734</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-12">
                            <p className="text-xs text-coffee-400 uppercase tracking-widest">Karnataka, India</p>
                        </div>
                    </div>

                    {/* Right: Query Form */}
                    <div className="w-full md:w-7/12 p-12 md:p-16 bg-white relative">
                        {formStatus === 'sent' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-12 text-center animate-fade-in">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-3xl font-serif font-bold text-coffee-900 mb-2">Message Sent</h3>
                                <p className="text-gray-500 mb-8">Our master roasters will review your query and get back to you shortly.</p>
                                <button onClick={() => setFormStatus('idle')} className="text-gold-600 font-bold uppercase tracking-widest hover:underline">Send Another</button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl md:text-3xl font-serif font-bold text-coffee-900 mb-2">Send us a Query</h3>
                                <p className="text-gray-500 mb-8 text-sm">Fill out the form below and we'll get brewing.</p>

                                <form className="space-y-6" onSubmit={handleQuerySubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Name</label>
                                            <input required name="name" type="text" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none transition-colors bg-transparent placeholder-gray-300 text-coffee-900" placeholder="Your Name" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                                            <input required name="email" type="email" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none transition-colors bg-transparent placeholder-gray-300 text-coffee-900" placeholder="your@email.com" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Query Type</label>
                                        <div className="relative">
                                            <select name="type" className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none transition-colors bg-transparent text-coffee-900 appearance-none cursor-pointer">
                                                <option>General Inquiry</option>
                                                <option>Wholesale / Bulk Order</option>
                                                {/* <option>Several Roast Profiles</option> */}
                                                <option>Collaborations</option>
                                            </select>
                                            <div className="absolute right-0 top-3 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Message</label>
                                        <textarea required name="message" rows={4} className="w-full border-b border-gray-300 py-2 focus:border-gold-500 outline-none transition-colors bg-transparent placeholder-gray-300 resize-none text-coffee-900" placeholder="Tell us about your coffee needs..."></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={formStatus === 'sending'}
                                        className="bg-coffee-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                                    >
                                        {formStatus === 'sending' ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <span>Send Message</span>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
