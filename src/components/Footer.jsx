import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 w-full py-12 px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <div className="col-span-1 md:col-span-1">
          <div className="text-lg font-bold text-slate-900 dark:text-white mb-4">PakBikes Balochistan</div>
          <p className="text-slate-500 text-sm leading-relaxed">The premier destination for buying and selling motorcycles in the heart of Balochistan. Trusted by thousands.</p>
        </div>
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white mb-4">Site Links</h5>
          <ul className="space-y-2">
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">About Us</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Careers</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Privacy Policy</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white mb-4">Popular Models</h5>
          <ul className="space-y-2">
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Honda CD 70</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Yamaha YBR 125</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Suzuki GS 150</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">United 70cc</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white mb-4">Support</h5>
          <ul className="space-y-2">
            <li><a className="text-primary font-bold hover:underline transition-all" href="#">WhatsApp Support</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Contact Info</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">FAQs</a></li>
            <li><a className="text-slate-500 hover:text-green-500 hover:underline transition-all" href="#">Safety Tips</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500">© 2024 PakBikes Balochistan. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
