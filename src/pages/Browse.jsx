import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseClient';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const FALLBACK_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkqAYvxtLGgNC3Bvb9t00nJ-sBcycN9_SGnXiilptzakWqWic6b9wa_Babe83Wr2iNU_z62VX5eZwoIrbBzmrlRJcLSbpF2uCRNnANPTcbKnyCsjRHAQCx2ZHSKpfqTmGjMR5VcHleeZ-rZAENfAKDJBTznPA3CBvN6btZpQ-Z0sI-DhOB0yqj2uh_GnIkYxCEq5kTag8EjJVW3DhGPufXV3GIsH0yVaeHAc8X2xkfz_YbuFJds2a6YwbyOujkXRrYdjb91bZRBwI';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const DEMO_BIKES = [
  {
    id: 'demo-1',
    title: 'Honda CD 70 Dream',
    price: 115000,
    city: 'Quetta',
    condition: 'used',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAkqAYvxtLGgNC3Bvb9t00nJ-sBcycN9_SGnXiilptzakWqWic6b9wa_Babe83Wr2iNU_z62VX5eZwoIrbBzmrlRJcLSbpF2uCRNnANPTcbKnyCsjRHAQCx2ZHSKpfqTmGjMR5VcHleeZ-rZAENfAKDJBTznPA3CBvN6btZpQ-Z0sI-DhOB0yqj2uh_GnIkYxCEq5kTag8EjJVW3DhGPufXV3GIsH0yVaeHAc8X2xkfz_YbuFJds2a6YwbyOujkXRrYdjb91bZRBwI'],
    _demo: true,
  },
  {
    id: 'demo-2',
    title: 'Yamaha YBR 125G',
    price: 435000,
    city: 'Gwadar',
    condition: 'new',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCXXiE-fYZC61vQfVNXymO6VC3pKYgKjwZTNHWlsDOeAjChJR6HXn4Bg5hIabbikWFDpsQtXUBWNW4BYTxMtBftk--Lf5aF1lNm2NlTb_IVy8D1OqaoBInoa7yJ1gzoFS0V-bcnvCZrUiYSTPK_xCk8-IGYd9A-47nrPBj0hSlR3tJAiI7ztjBCGIDSL0LHva6CAYiK9kLiH2UYmLELhRbaWBv83vcQ19wYGx-tA3EB8fJq42wz-C7_zmN98OpTet1X2ec6Gm4cqzM'],
    _demo: true,
  },
  {
    id: 'demo-3',
    title: 'Suzuki GD 110S',
    price: 210000,
    city: 'Turbat',
    condition: 'used',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBqPIwx2fu-k7PiVMISHB_zgjgjiF21RWUigGrP0TMzvfcVR46eQ5ytgtvq2iKjz7nLSTHifdVwxwy20EKcOMWXiyFZB3knifrucdj9Y5cZhsoLBXSY9EAvduYVMmIi0wWUHxf6GHAowX0JYnY8L3nn2bPpK0sUD8n6KIZV2xW_xoCvQD-BKswTcTr3lOuDSc9bOEbnhlDMXUFd1AxcOekOnlAGApo-_MGAMr2_IsJ8J_f_7wBTIL8OR5r6g4UcseEBsw3ziMaaNM0'],
    _demo: true,
  },
];

const Browse = () => {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [condition, setCondition] = useState('all');
  const [sellerProfiles, setSellerProfiles] = useState({});

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    console.log('Fetching listings...');
    const timer = setTimeout(() => {
      console.warn('Fetch took too long, showing demo bikes');
      setBikes(DEMO_BIKES);
      setLoading(false);
    }, 10000);

    try {
      setLoading(true);
      const q = query(
        collection(db, 'bike_listings'),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const activeData = data.filter(b => b.status === 'active');

      console.log('Real data fetched:', activeData);
      if (!activeData || activeData.length === 0) {
        console.warn('No active listings found in database.');
      }
      // Merge real listings first, then demo bikes
      const allBikes = [...activeData, ...DEMO_BIKES];
      setBikes(allBikes);

      // Fetch seller profiles for batch
      const userIds = [...new Set(activeData.map(b => b.user_id))].filter(Boolean);
      if (userIds.length > 0) {
        try {
          const profiles = {};
          await Promise.all(userIds.map(async (uid) => {
            const pSnap = await getDoc(doc(db, 'profiles', uid));
            if (pSnap.exists()) profiles[uid] = pSnap.data();
          }));
          setSellerProfiles(profiles);
        } catch (err) {
          console.error('Error fetching seller profiles batch:', err);
        }
      }
    } catch (err) {
      console.error('Fetch exception:', err);
      setBikes(DEMO_BIKES);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  // Apply client-side filters
  const filtered = bikes.filter(bike => {
    if (selectedCities.length > 0 && !selectedCities.includes(bike.city)) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(bike.brand)) return false;
    if (bike.price > maxPrice) return false;
    if (condition !== 'all' && bike.condition !== condition) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return 0;
  });

  const toggleCity = (city) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const activeFilterCount = selectedCities.length + selectedBrands.length + (condition !== 'all' ? 1 : 0) + (maxPrice < 500000 ? 1 : 0);

  return (
    <main className="pt-20 pb-24 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-3 md:pt-6 md:pb-6">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background font-headline">Find Your Ride</h1>
        <p className="text-on-surface-variant mt-0.5 text-sm">
          {loading ? 'Loading...' : `${sorted.length} bike${sorted.length !== 1 ? 's' : ''} in Balochistan`}
        </p>
      </div>

      {/* ── MOBILE FILTER BAR ── */}
      <div className="md:hidden sticky top-16 z-20 bg-background/95 backdrop-blur-sm px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-surface-container mb-4">
        {/* Filter sheet toggle */}
        <button
          onClick={() => setShowFilterSheet(true)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all ${
            activeFilterCount > 0
              ? 'bg-primary text-white border-primary'
              : 'bg-surface-container border-outline-variant text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined" style={{fontSize:'15px'}}>tune</span>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>

        {/* Sort chips */}
        {[{v:'newest',l:'Newest'},{v:'price_asc',l:'Price ↑'},{v:'price_desc',l:'Price ↓'}].map(o => (
          <button key={o.v} onClick={() => setSortBy(o.v)}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold border transition-all ${
              sortBy === o.v ? 'bg-primary text-white border-primary' : 'bg-surface-container border-outline-variant text-on-surface'
            }`}>
            {o.l}
          </button>
        ))}

        {/* Condition chips */}
        {['new','used'].map(c => (
          <button key={c} onClick={() => setCondition(condition === c ? 'all' : c)}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold border capitalize transition-all ${
              condition === c ? 'bg-primary text-white border-primary' : 'bg-surface-container border-outline-variant text-on-surface'
            }`}>
            {c}
          </button>
        ))}

        {/* Active city chips */}
        {selectedCities.map(city => (
          <button key={city} onClick={() => toggleCity(city)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-primary text-white">
            {city}
            <span className="material-symbols-outlined" style={{fontSize:'13px'}}>close</span>
          </button>
        ))}
      </div>

      {/* ── MOBILE FILTER SHEET (bottom drawer) ── */}
      {showFilterSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilterSheet(false)} />
          <div className="relative w-full bg-background rounded-t-3xl p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-lg">Filters</h2>
              <button onClick={() => setShowFilterSheet(false)} className="p-2 rounded-full bg-surface-container">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* City */}
            <div>
              <h3 className="font-bold mb-3 text-sm text-on-surface-variant uppercase tracking-wide">City</h3>
              <div className="flex flex-wrap gap-2">
                {['Quetta','Turbat','Gwadar','Khuzdar','Hub','Chaman'].map(city => (
                  <button key={city} onClick={() => toggleCity(city)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      selectedCities.includes(city) ? 'bg-primary text-white border-primary' : 'bg-surface-container border-outline-variant'
                    }`}>
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <h3 className="font-bold mb-3 text-sm text-on-surface-variant uppercase tracking-wide">Brand</h3>
              <div className="flex flex-wrap gap-2">
                {['Honda', 'Yamaha', 'Suzuki', 'United', 'Road Prince'].map(brand => (
                  <button key={brand} onClick={() => toggleBrand(brand)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      selectedBrands.includes(brand) ? 'bg-primary text-white border-primary' : 'bg-surface-container border-outline-variant'
                    }`}>
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div>
              <h3 className="font-bold mb-3 text-sm text-on-surface-variant uppercase tracking-wide">Max Price</h3>
              <input type="range" min="20000" max="500000" step="5000"
                value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs font-bold text-secondary mt-1">
                <span>20k</span>
                <span className="text-primary">{maxPrice >= 500000 ? '500k+' : `${(maxPrice/1000).toFixed(0)}k`}</span>
              </div>
            </div>

            {/* Condition */}
            <div>
              <h3 className="font-bold mb-3 text-sm text-on-surface-variant uppercase tracking-wide">Condition</h3>
              <div className="flex gap-3">
                {['all','new','used'].map(c => (
                  <button key={c} onClick={() => setCondition(c)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold capitalize transition-all ${
                      condition === c ? 'bg-primary text-white' : 'bg-surface-container text-on-surface'
                    }`}>{c}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setSelectedCities([]); setSelectedBrands([]); setMaxPrice(500000); setCondition('all'); }}
                className="flex-1 py-3 rounded-2xl border border-outline-variant text-sm font-bold">Clear</button>
              <button onClick={() => setShowFilterSheet(false)}
                className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold">Show Results</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8 px-4 md:px-6">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <div className="sticky top-28 space-y-8 bg-surface-container-low p-6 rounded-3xl">
            <div>
              <h3 className="font-bold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span> City
              </h3>
              <div className="space-y-3">
                {['Quetta', 'Turbat', 'Gwadar', 'Khuzdar', 'Hub', 'Chaman'].map(city => (
                  <label key={city} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={selectedCities.includes(city)}
                      onChange={() => toggleCity(city)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20" />
                    <span className="text-sm group-hover:text-primary transition-colors">{city}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">directions_bike</span> Brand
              </h3>
              <div className="space-y-3">
                {['Honda', 'Yamaha', 'Suzuki', 'United', 'Road Prince', 'Ravi'].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20" />
                    <span className="text-sm group-hover:text-primary transition-colors">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-on-background mb-4">Max Price (PKR)</h3>
              <input type="range" min="20000" max="500000" step="5000"
                value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer" />
              <div className="flex justify-between text-xs font-bold text-secondary mt-2">
                <span>20k</span>
                <span className="text-primary">{maxPrice >= 500000 ? '500k+' : `${(maxPrice / 1000).toFixed(0)}k`}</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-on-background mb-4">Condition</h3>
              <div className="grid grid-cols-3 gap-2">
                {['all', 'new', 'used'].map(c => (
                  <button key={c} onClick={() => setCondition(c)}
                    className={`py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                      condition === c ? 'bg-primary text-white' : 'border border-outline-variant hover:border-primary hover:text-primary'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
            <button onClick={() => { setSelectedCities([]); setSelectedBrands([]); setMaxPrice(500000); setCondition('all'); }}
              className="w-full py-3 border border-outline-variant text-on-surface-variant font-bold rounded-2xl hover:border-primary hover:text-primary transition-colors text-sm">
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Listing Grid */}
        <section className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-surface-container-lowest rounded-3xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-surface-container-high" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-surface-container-high rounded-lg w-3/4" />
                    <div className="h-7 bg-surface-container-high rounded-lg w-1/2" />
                    <div className="h-4 bg-surface-container-high rounded-lg w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">search_off</span>
              <h3 className="font-headline text-2xl font-bold text-on-background mb-2">No bikes found</h3>
              <p className="text-on-surface-variant">Try adjusting the filters or <Link to="/sell" className="text-primary font-bold underline">post your bike</Link>.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {sorted.map(bike => (
                <article 
                  key={bike.id} 
                  onClick={() => navigate(`/bike/${bike.id}`)}
                  className="bg-surface-container-lowest rounded-3xl overflow-hidden group shadow-sm hover:shadow-xl transition-all flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={getOptimizedImageUrl((bike.photos && bike.photos[0]) || FALLBACK_IMAGE, 'w_600,f_auto,q_auto')}
                      alt={bike.title}
                      onError={e => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    {!bike._demo && (
                      <div className="absolute top-4 left-4 bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">Live Ad</div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); /* Handle favorite */ }}
                      className="absolute top-4 right-4 p-2 bg-white/50 backdrop-blur-md rounded-full text-on-surface hover:bg-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">favorite</span>
                    </button>
                  </div>
                  <div className="p-3 md:p-5 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="font-headline font-bold text-sm md:text-lg text-on-background leading-tight line-clamp-2">{bike.title}</h2>
                      <span className={`ml-1 shrink-0 px-1.5 py-0.5 text-[9px] md:text-[10px] font-black rounded-md uppercase ${bike.condition === 'new' ? 'bg-primary-container/20 text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {bike.condition}
                      </span>
                    </div>
                    <p className="text-base md:text-2xl font-extrabold text-primary mb-2">
                      Rs {Number(bike.price).toLocaleString()}
                    </p>
                    <div className="flex flex-col md:flex-row md:flex-wrap gap-1 md:gap-4 text-secondary text-[11px] md:text-xs font-medium mb-3">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{fontSize:'13px'}}>location_on</span>
                        {bike.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{fontSize:'13px'}}>schedule</span>
                        {timeAgo(bike.created_at)}
                      </div>
                      {sellerProfiles[bike.user_id]?.is_verified && (
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <span className="material-symbols-outlined" style={{fontSize:'14px', fontVariationSettings: "'FILL' 1"}}>verified</span>
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="mt-auto w-full flex items-center justify-center gap-1 bg-primary-container/10 group-hover:bg-primary-container text-on-primary-container group-hover:text-white py-2 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all text-xs md:text-sm">
                      <span className="md:hidden">Details</span>
                      <span className="hidden md:inline">View Details</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Browse;
