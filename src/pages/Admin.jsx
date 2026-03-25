import React, { useState, useEffect } from 'react';
import { db } from '../firebaseClient';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const FALLBACK_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkqAYvxtLGgNC3Bvb9t00nJ-sBcycN9_SGnXiilptzakWqWic6b9wa_Babe83Wr2iNU_z62VX5eZwoIrbBzmrlRJcLSbpF2uCRNnANPTcbKnyCsjRHAQCx2ZHSKpfqTmGjMR5VcHleeZ-rZAENfAKDJBTznPA3CBvN6btZpQ-Z0sI-DhOB0yqj2uh_GnIkYxCEq5kTag8EjJVW3DhGPufXV3GIsH0yVaeHAc8X2xkfz_YbuFJds2a6YwbyOujkXRrYdjb91bZRBwI';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'listings'
  const [listingSearch, setListingSearch] = useState('');
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'profiles'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const listingsSnap = await getDocs(collection(db, 'bike_listings'));
      const listingsData = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setUsers(usersData);
      setListings(listingsData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPostCount = (userId) => {
    return listings.filter(l => l.user_id === userId).length;
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await updateDoc(doc(db, 'profiles', userId), { status });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const deleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'bike_listings', listingId));
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err) {
      alert('Failed to delete listing: ' + err.message);
    }
  };

  const toggleVerification = async (userId, current) => {
    try {
      await updateDoc(doc(db, 'profiles', userId), { is_verified: !current });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !current } : u));
    } catch (err) {
      alert('Failed to update verification');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesCity = filterCity === 'All' || u.city === filterCity;
    const matchesSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.phone || '').includes(search);
    return matchesCity && matchesSearch;
  });

  const filteredListings = listings.filter(l => {
    const seller = users.find(u => u.id === l.user_id);
    const matchesSearch = (l.title || '').toLowerCase().includes(listingSearch.toLowerCase()) ||
                          (l.brand || '').toLowerCase().includes(listingSearch.toLowerCase()) ||
                          (l.city || '').toLowerCase().includes(listingSearch.toLowerCase()) ||
                          (seller?.full_name || '').toLowerCase().includes(listingSearch.toLowerCase());
    return matchesSearch;
  });

  const cities = ['All', ...new Set(users.map(u => u.city).filter(Boolean))];

  if (loading) {
    return (
      <div className="pt-32 pb-32 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="pt-28 pb-32 px-4 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-on-background mb-2">Admin Control</h1>
        <p className="text-on-surface-variant font-medium">Manage users and verified sellers in Balochistan.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface-container-low rounded-2xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          Users ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('listings')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'listings' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          Listings ({listings.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" placeholder="Search by name or phone..." 
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-2xl outline-none border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
        <div className="w-full md:w-64 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">location_on</span>
          <select 
            value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-2xl outline-none appearance-none font-bold text-on-surface"
          >
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* User Cards (Mobile Optimized) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(u => (
                <div key={u.id} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                        {u.full_name || 'Guest User'}
                        {u.is_verified && <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                      </h3>
                      <p className="text-sm font-medium text-on-surface-variant">{u.phone || 'No Phone'}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      u.status === 'banned' ? 'bg-error-container text-on-error-container' :
                      u.status === 'suspended' ? 'bg-warning-container text-on-warning-container' :
                      'bg-primary-container text-on-primary-container'
                    }`}>
                      {u.status || 'Active'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-container-low p-3 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-on-surface-variant mb-1">City</p>
                      <p className="font-bold text-sm">{u.city || 'N/A'}</p>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-on-surface-variant mb-1">Posts</p>
                      <p className="font-bold text-sm">{getPostCount(u.id)} Bikes</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-outline-variant/30 grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => toggleVerification(u.id, u.is_verified)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        u.is_verified ? 'bg-surface-container-highest text-on-surface' : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {u.is_verified ? 'Unverify' : 'Verify Seller'}
                    </button>
                    <div className="relative group">
                      <button className="w-full py-2 bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all">
                        Actions
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl overflow-hidden hidden group-hover:block border border-outline-variant/30 z-20">
                        <button onClick={() => updateUserStatus(u.id, 'active')} className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-slate-50 border-b border-outline-variant/10 text-primary">Activate User</button>
                        <button onClick={() => updateUserStatus(u.id, 'suspended')} className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-slate-50 border-b border-outline-variant/10 text-warning">Suspend User</button>
                        <button onClick={() => updateUserStatus(u.id, 'banned')} className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-slate-50 text-error">Ban User</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-surface-container-low rounded-[3rem] border border-dashed border-outline-variant/50">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">person_search</span>
                <p className="font-bold text-on-surface-variant text-lg">No users found matching your criteria.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Listings UI */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                type="text" placeholder="Search by title, brand, or city..." 
                value={listingSearch} onChange={(e) => setListingSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-2xl outline-none border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 md:gap-4 lg:grid-cols-4 gap-2 lg:gap-4">
            {filteredListings.length > 0 ? (
              filteredListings.map(l => (
                <div key={l.id} className="bg-surface-container-lowest overflow-hidden rounded-xl lg:rounded-[2.5rem] shadow-sm border border-outline-variant/30 flex flex-col">
                  {l.photos && l.photos[0] && (
                    <div className="aspect-[4/3] lg:aspect-video relative shrink-0 overflow-hidden lg:rounded-t-[2.5rem]">
                      <img 
                        src={getOptimizedImageUrl(l.photos[0], 'w_500,f_auto,q_auto')} 
                        alt={l.title} 
                        className="w-full h-full object-cover" 
                        onError={e => e.target.src = FALLBACK_IMAGE}
                      />
                      <div className="absolute top-2 left-2 lg:top-4 lg:left-4">
                        <span className="px-1.5 py-0.5 lg:px-3 lg:py-1 bg-black/60 backdrop-blur-md text-white rounded-md lg:rounded-xl text-[7px] lg:text-[10px] font-black uppercase tracking-widest shrink-0">
                          {l.status}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-1.5 lg:p-6 flex flex-col flex-1 min-w-0">
                    <div className="flex flex-col gap-1 lg:gap-4 mb-2 lg:mb-6">
                      <div className="text-center lg:text-left">
                        <h3 className="font-headline font-bold text-[9px] lg:text-xl xl:text-2xl text-on-surface truncate mb-0.5">{l.title}</h3>
                        <div className="flex items-center justify-center lg:justify-start gap-1">
                          <span className="text-primary font-bold text-[7px] lg:text-sm">Rs</span>
                          <span className="text-primary font-black text-[8px] lg:text-xl xl:text-2xl">{Number(l.price).toLocaleString()}</span>
                        </div>
                        {/* Mobile Seller Row */}
                        <div className="lg:hidden mt-1 flex flex-col items-center gap-0.5 text-on-surface-variant/80 font-bold leading-none">
                          <span className="text-[6px] truncate w-full px-0.5">{users.find(u => u.id === l.user_id)?.full_name || 'Seller'}</span>
                          <span className="text-[5px] truncate w-full px-0.5">{l.city}</span>
                        </div>
                      </div>
                      
                      <div className="hidden lg:flex flex-col gap-2 bg-surface-container-low p-4 rounded-[1.5rem] xl:rounded-[2rem]">
                        <div className="flex items-center gap-3 text-on-surface-variant text-xs xl:text-sm font-bold overflow-hidden">
                          <span className="material-symbols-outlined text-lg xl:text-xl shrink-0">person</span>
                          <span className="truncate">{users.find(u => u.id === l.user_id)?.full_name || 'Unknown Seller'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-on-surface-variant text-xs xl:text-sm font-bold overflow-hidden">
                          <span className="material-symbols-outlined text-lg xl:text-xl shrink-0">location_on</span>
                          <span className="truncate">{l.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col lg:flex-row gap-1 lg:gap-3">
                      <a 
                        href={`/bike/${l.id}`} target="_blank" rel="noopener noreferrer"
                        className="w-full py-1 lg:py-3 bg-surface-container-highest text-on-surface rounded-md lg:rounded-full text-[7px] lg:text-sm font-black text-center hover:shadow-lg transition-all"
                      >
                        View
                      </a>
                      <button 
                        onClick={() => deleteListing(l.id)}
                        className="w-full py-1 lg:py-3 bg-error/10 text-error rounded-md lg:rounded-full text-[7px] lg:text-sm font-black hover:bg-error/20 transition-all flex items-center justify-center gap-1 lg:gap-2"
                      >
                        <span className="material-symbols-outlined text-[8px] lg:text-lg shrink-0">delete</span>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-surface-container-low rounded-[3rem] border border-dashed border-outline-variant/50">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">no_photography</span>
                <p className="font-bold text-on-surface-variant text-lg">No listings found matching your criteria.</p>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default Admin;
