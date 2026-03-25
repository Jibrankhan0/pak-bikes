import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebaseClient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import { useAuth } from '../context/useAuth';

const Home = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    if (!authLoading) {
      fetchBikes();
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [authLoading]);

  const fetchBikes = async () => {
    console.log(`Fetching featured bikes...`);
    setFetchError(null);
    const timer = setTimeout(() => {
      console.warn('Featured bikes fetch took too long');
      setFetchError('Connection timeout. Please check your internet or ad-blocker.');
      setLoading(false);
    }, 10000);

    try {
      setLoading(true);
      console.log('📡 Fetching from Firestore...');
      
      // We fetch the latest 15 bikes and filter locally to 4 active bikes
      // This avoids requiring a composite index in newly created Firebase projects!
      const q = query(
        collection(db, 'bike_listings'),
        orderBy('created_at', 'desc'),
        limit(15)
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log('✅ Home data received:', data.length, 'bikes.');
      
      const activeBikes = data.filter(b => b.status === 'active').slice(0, 4);
      setBikes(activeBikes);
      
    } catch (err) {
      console.error('💥 Home fetch exception:', err);
      if (err.message.includes('offline')) {
        setFetchError('You are currently offline. Please check your internet connection.');
      } else {
        setFetchError(`Database error: ${err.message}`);
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    navigate(`/browse?${params.toString()}`);
  };
  const cities = [
    { name: 'Quetta', ads: '1,240 Ads' },
    { name: 'Turbat', ads: '450 Ads' },
    { name: 'Gwadar', ads: '320 Ads' },
    { name: 'Khuzdar', ads: '180 Ads' },
    { name: 'Chaman', ads: '95 Ads' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[100svh] md:min-h-[870px] flex items-end md:items-center px-4 md:px-6 pb-24 md:py-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Modern Black Motorcycle" 
            className="w-full h-full object-cover scale-105" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzTrVTn7LVjbZNosqlq3uNeJ0eVxS_92q71faqHc8v0C0Xl4mhhDOkU6AW4HDvUGz8fmew9CFJxY5NdpvTPCNfWSvoOAkJ5Tp5r7Jf5QXJ9g8pyWMSAgjKsG5526AUDOOREBjOYjSYSE5AzwsZEZE8wIatst2amMmIWZbo0RSp7XpPd3YaohqZkO4CN9YPrPujqUCSIEDNLxa22U7eFkscy2s10EDt3JBWoomD9KuipAIPNBrSdFU94F8m91FWPHHrweqB_W5rcOw" 
          />
          {/* Mobile: bottom-up scrim — lighter so image shows through */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent md:hidden" />
          <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-background via-background/70 to-transparent" />
          {/* Top scrim for Navbar contrast */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-10" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl">
            {/* Glowing badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 md:mb-6"
              style={{background: 'rgba(37,211,102,0.25)', border: '1px solid rgba(37,211,102,0.5)', backdropFilter: 'blur(8px)'}}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-white font-bold text-xs md:text-sm font-body" style={{textShadow: '0 1px 4px rgba(0,0,0,0.5)'}}>Balochistan's #1 Marketplace</span>
            </div>

            <h1 className="text-3xl md:text-7xl font-headline font-extrabold leading-tight md:leading-[1.1] mb-5 md:mb-8 tracking-tight"
              style={{textShadow: '0 4px 15px rgba(0,0,0,0.5)'}}>
              <span className="text-white md:text-on-background">Find Your Next </span>
              <span className="text-primary" style={{textShadow: '0 0 20px rgba(37,211,102,0.3)'}}>Desert Legend.</span>
            </h1>
            
            {/* Search/Filter Bar */}
            <div className="p-2 md:p-3 rounded-2xl md:rounded-3xl flex flex-col md:flex-row gap-2 md:gap-3"
              style={{
                background: 'rgba(255,255,255,0.7)', 
                backdropFilter: 'blur(30px)', 
                border: '1px solid rgba(255,255,255,0.8)', 
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
              }}>
              <div className="flex-1 w-full relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 border-none rounded-xl transition-all font-medium outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white/50 focus:bg-white" 
                  placeholder="Search bikes (e.g. Honda 125)" 
                  type="text" 
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 md:w-40 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">location_on</span>
                  <select className="w-full pl-10 pr-3 py-3 border-none rounded-xl appearance-none font-medium outline-none text-sm text-slate-900 bg-white/50 focus:bg-white cursor-pointer">
                    <option className="text-slate-900">All Cities</option>
                    <option className="text-slate-900">Quetta</option>
                    <option className="text-slate-900">Gwadar</option>
                    <option className="text-slate-900">Turbat</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
                <Link to="/browse" className="px-5 md:px-8 py-3 rounded-xl font-bold text-sm md:text-base whitespace-nowrap flex items-center gap-1 transition-all active:scale-95 text-white"
                  style={{background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 4px 15px rgba(37,211,102,0.4)'}}>
                  <span className="material-symbols-outlined text-lg">explore</span>
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Bikes Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24">
        <div className="flex justify-between items-end mb-6 md:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-6 rounded-full" style={{background: 'linear-gradient(135deg, #25d366, #128c7e)'}} />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Live Ads</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-background tracking-tight">Featured Listings</h2>
            <p className="text-on-surface-variant mt-0.5 text-sm">Hand-picked bikes across Balochistan</p>
          </div>
          <Link to="/browse" className="flex items-center gap-1 font-bold text-sm transition-all hover:gap-2 shrink-0"
            style={{color: '#25d366'}}>
            View All <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl md:rounded-[1.5rem] p-4 h-64 animate-pulse">
                <div className="aspect-[4/3] bg-slate-200 rounded-xl mb-4" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))
          ) : fetchError ? (
            <div className="col-span-full py-12 px-4 text-center bg-red-50 rounded-[2rem] border border-red-200">
               <span className="material-symbols-outlined text-red-500 text-4xl mb-3">error</span>
               <h3 className="text-red-800 font-bold mb-2">Failed to load listings</h3>
               <p className="text-red-600 text-sm font-medium">{fetchError}</p>
               <button onClick={fetchBikes} className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-full font-bold hover:bg-red-200 transition-colors">
                 Try Again
               </button>
            </div>
          ) : bikes.length > 0 ? (
            bikes.map((bike) => (
              <Link key={bike.id} to={`/bike/${bike.id}`}
                className="group bg-white rounded-2xl md:rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 block"
                style={{boxShadow: '0 2px 12px rgba(0,0,0,0.07)'}}>
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img 
                    alt={bike.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    src={bike.photos && bike.photos[0] ? getOptimizedImageUrl(bike.photos[0], 'w_600,f_auto,q_auto') : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'} 
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold shadow-sm"
                      style={{background: 'rgba(37,211,102,0.9)', color: 'white', backdropFilter: 'blur(4px)'}}>
                      {bike.condition?.toUpperCase() || 'USED'}
                    </span>
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-headline font-bold text-sm md:text-base text-slate-900 leading-tight line-clamp-1 mb-1">{bike.title}</h3>
                  <p className="font-extrabold text-sm md:text-base mb-2" style={{color: '#128c7e'}}>Rs {new Intl.NumberFormat().format(bike.price)}</p>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 font-medium mb-3">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined" style={{fontSize:'12px'}}>location_on</span>
                      {bike.city}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined" style={{fontSize:'12px'}}>calendar_today</span>
                      {bike.model_year || 'N/A'}
                    </span>
                  </div>
                  <div className="w-full py-2 md:py-2.5 rounded-xl font-bold flex items-center justify-center gap-1 text-xs md:text-sm text-white transition-all"
                    style={{background: 'linear-gradient(135deg, #25d366, #128c7e)'}}>
                    <span className="material-symbols-outlined" style={{fontSize:'14px'}}>chat</span>
                    <span className="hidden md:inline">WhatsApp</span>
                    <span className="md:hidden">Contact</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
               <p className="text-slate-500 font-medium">No active listings in Balochistan yet.</p>
            </div>
          )}

        </div>
      </section>

      {/* Explore by City Section */}
      <section className="py-12 md:py-24" style={{background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)'}}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-6 md:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)'}}>
              <span className="material-symbols-outlined text-primary" style={{fontSize:'14px'}}>location_on</span>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">All Pakistan</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-slate-900 tracking-tight">Explore by City</h2>
          </div>
          <div className="grid grid-cols-3 md:flex md:flex-wrap justify-center gap-3 md:gap-4">
            {cities.map((city) => (
              <Link 
                key={city.name}
                to={`/browse?city=${city.name}`}
                className="group relative px-4 md:px-8 py-4 md:py-6 bg-white rounded-2xl md:rounded-3xl hover:-translate-y-1 transition-all text-center overflow-hidden"
                style={{boxShadow: '0 2px 12px rgba(0,0,0,0.06)'}}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: 'linear-gradient(135deg, #25d366, #128c7e)'}} />
                <span className="relative block text-lg md:text-2xl font-bold font-headline text-slate-900 group-hover:text-white transition-colors">{city.name}</span>
                <span className="relative text-[10px] md:text-xs text-slate-400 group-hover:text-white/80 transition-colors uppercase tracking-widest font-bold">{city.ads}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop FAB */}
      <Link 
        to="/sell" 
        className="fixed bottom-8 right-8 text-white p-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 hidden md:flex items-center gap-2 font-bold"
        style={{background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.4)'}}
      >
        <span className="material-symbols-outlined">add_circle</span>
        <span>Post Your Bike</span>
      </Link>
    </div>
  );
};

export default Home;
