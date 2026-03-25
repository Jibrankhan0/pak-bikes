import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;
      try {
        const q = query(
          collection(db, 'bike_listings'), 
          where('user_id', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        setActiveListingsCount(snapshot.size);
      } catch (err) {
        console.error('Error fetching user stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const getInitials = () => {
    const name = profile?.full_name || user?.displayName || user?.email || '';
    const parts = name.split(/[\s@]/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
  };

  const memberSince = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const userDetails = [
    { icon: 'mail', label: 'Email Address', value: user.email },
    { icon: 'call', label: 'Phone Number', value: profile?.phone || 'Not provided' },
    { icon: 'map', label: 'Province', value: profile?.province || 'Balochistan' },
    { icon: 'location_on', label: 'City', value: profile?.city || 'Quetta' },
    { icon: 'home_pin', label: 'Area', value: profile?.area || 'Not provided' },
  ];

  return (
    <main className="pt-24 pb-32 px-4 md:px-6 max-w-5xl mx-auto min-h-screen font-headline">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-8">
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary to-primary-container relative">
          <div className="absolute top-4 right-4 text-white/40">
            <span className="material-symbols-outlined text-8xl opacity-10 rotate-12">account_circle</span>
          </div>
        </div>
        
        <div className="px-6 md:px-12 pb-8 flex flex-col items-center md:items-start relative">
          {/* Avatar Container */}
          <div className="relative -mt-16 md:-mt-24 mb-6 md:mb-8 group">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] md:rounded-[3rem] bg-white p-2 shadow-2xl border border-slate-50 flex items-center justify-center">
              <div className="w-full h-full rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl md:text-5xl overflow-hidden shadow-inner"
                style={!profile?.photo_url ? { background: 'linear-gradient(135deg, #25d366, #128c7e)' } : {}}>
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
            </div>
            {/* Online Status Badge */}
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-2 tracking-tight">
                {profile?.full_name || 'User'}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Verified Seller
                </span>
                <span className="text-slate-400 text-xs md:text-sm font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Member since {memberSince}
                </span>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => navigate('/my-ads')}
                className="flex-1 md:flex-none px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm md:text-base transition-all hover:bg-slate-800 shadow-lg active:scale-95"
              >
                My Listings
              </button>
              <button 
                onClick={() => navigate('/profile-setup', { state: { edit: true } })}
                className="flex-1 md:flex-none px-6 py-4 border-2 border-primary text-primary rounded-2xl font-bold text-sm md:text-base transition-all hover:bg-primary/5 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Information Display */}
        <div className="md:col-span-2 space-y-8">
          {/* User Details Card */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">info</span>
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
              {userDetails.map((detail, index) => (
                <div key={index} className="flex gap-4 md:gap-5 border-b border-slate-50 pb-4 md:border-none md:pb-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-2xl">{detail.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{detail.label}</p>
                    <p className="text-sm md:text-lg font-bold text-slate-800 truncate">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Statistics Card */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-slate-100 flex flex-col h-full">
            <h2 className="text-xl font-black text-slate-900 mb-8">Performance</h2>
            
            <div className="space-y-6 flex-grow">
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 flex flex-col items-center text-center">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Active Listings</p>
                {loadingStats ? (
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <p className="text-5xl font-black text-primary leading-none">{activeListingsCount}</p>
                )}
                <p className="mt-4 text-[10px] font-bold text-slate-500">Live in Balochistan Market</p>
              </div>

              <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Trust Score</p>
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-2xl">star</span>
                </div>
                <p className="text-xl font-black text-slate-800">High Trust</p>
              </div>
            </div>

            <button 
              onClick={signOut}
              className="mt-10 px-6 py-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;
