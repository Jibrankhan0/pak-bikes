import React, { useState, useEffect } from 'react';
import { db } from '../firebaseClient';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState('All');
  const [search, setSearch] = useState('');

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
    </main>
  );
};

export default Admin;
