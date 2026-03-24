import React from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  return (
    <main className="pt-28 pb-32 px-4 md:px-6 max-w-4xl mx-auto min-h-screen">
      <div className="relative">
        {/* Background Decorative Elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <header className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-on-background font-headline mb-4">
              Get in <span className="text-primary italic">Touch</span>
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl leading-relaxed">
              Have questions about buying or selling bikes in Balochistan? We're here to help you get the best deal.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Cards */}
            <div className="space-y-6">
              {/* WhatsApp Card */}
              <a 
                href="https://wa.me/923178408819" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-6 p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 hover:bg-white transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary text-white shadow-lg group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">chat</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-background mb-0.5">WhatsApp Us</h3>
                  <p className="text-primary font-black text-xl">+92 317 8408819</p>
                  <p className="text-on-surface-variant text-sm mt-1">Available 24/7 for support</p>
                </div>
              </a>

              {/* Email Card */}
              <a 
                href="mailto:jibrankhandehpal@gmail.com" 
                className="group flex items-center gap-6 p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 hover:bg-white transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-secondary text-white shadow-lg group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">mail</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-background mb-0.5">Email Support</h3>
                  <p className="text-secondary font-black text-lg break-all">jibrankhandehpal@gmail.com</p>
                  <p className="text-on-surface-variant text-sm mt-1">We'll respond within 24 hours</p>
                </div>
              </a>
            </div>

            {/* Extra Details / About */}
            <div className="bg-primary/5 rounded-[2rem] p-8 flex flex-col justify-center border border-primary/10">
              <h2 className="text-2xl font-bold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified</span>
                Why Choose Us?
              </h2>
              <ul className="space-y-4 text-on-surface-variant">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">●</span>
                  <span><strong>Locally Focused:</strong> Specialized for the Balochistan market, from Quetta to Gwadar.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">●</span>
                  <span><strong>Secure Trading:</strong> Verified listings to ensure a safe buying experience.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">●</span>
                  <span><strong>Free Posting:</strong> Post your bike ads for free and reach thousands of buyers.</span>
                </li>
              </ul>
              
              <div className="mt-10 pt-8 border-t border-primary/10">
                <p className="text-sm font-medium text-on-surface-variant italic">
                  "Our mission is to make bike trading accessible and effortless for everyone in Balochistan."
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/browse" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Contact;
