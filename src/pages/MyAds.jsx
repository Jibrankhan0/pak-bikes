import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const FALLBACK_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkqAYvxtLGgNC3Bvb9t00nJ-sBcycN9_SGnXiilptzakWqWic6b9wa_Babe83Wr2iNU_z62VX5eZwoIrbBzmrlRJcLSbpF2uCRNnANPTcbKnyCsjRHAQCx2ZHSKpfqTmGjMR5VcHleeZ-rZAENfAKDJBTznPA3CBvN6btZpQ-Z0sI-DhOB0yqj2uh_GnIkYxCEq5kTag8EjJVW3DhGPufXV3GIsH0yVaeHAc8X2xkfz_YbuFJds2a6YwbyOujkXRrYdjb91bZRBwI';

const MyAds = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyAds();
  }, [user]);

  const fetchMyAds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bike_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setAds(data || []);
    setLoading(false);
  };

  const deleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    const { error } = await supabase
      .from('bike_listings')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting ad: ' + error.message);
    } else {
      setAds(prev => prev.filter(ad => ad.id !== id));
    }
  };

  return (
    <main className="pt-28 pb-32 px-4 md:px-6 max-w-7xl mx-auto min-h-screen">
      <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-background font-headline">My Listings</h1>
          <p className="text-on-surface-variant mt-2 text-lg">Manage and track your active bike ads.</p>
        </div>
        <Link to="/sell" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all w-full md:w-auto">
          <span className="material-symbols-outlined">add_circle</span>
          Post New Ad
        </Link>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-surface-container-high rounded-3xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/30">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">no_photography</span>
          </div>
          <h3 className="text-2xl font-bold text-on-background mb-2">No active listings</h3>
          <p className="text-on-surface-variant mb-8 max-w-xs">You haven't posted any bikes yet. Start selling today!</p>
          <Link to="/sell" className="text-primary font-bold underline flex items-center gap-1">
            Post your first bike <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map(bike => (
            <div 
              key={bike.id} 
              onClick={() => navigate(`/bike/${bike.id}`)}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-surface-container-high flex flex-col group cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={getOptimizedImageUrl((bike.photos && bike.photos[0]) || FALLBACK_IMAGE, 'w_600,f_auto,q_auto')}
                  alt={bike.title}
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${bike.status === 'active' ? 'bg-primary/90 text-white' : 'bg-slate-400 text-white'}`}>
                    {bike.status}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-headline font-bold text-lg text-on-background line-clamp-1">{bike.title}</h2>
                  <span className="text-xs font-bold text-slate-400">{new Date(bike.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-2xl font-black text-primary mb-6">Rs {Number(bike.price).toLocaleString()}</p>
                
                <div className="flex gap-3 mt-auto">
                  <div className="flex-1 py-3 bg-surface-container-high rounded-xl font-bold text-sm flex items-center justify-center gap-1 group-hover:bg-slate-200 transition-colors">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteAd(bike.id); }}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-1 hover:bg-red-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default MyAds;
