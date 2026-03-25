import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseClient';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const DEMO_BIKES = {
  'demo-1': {
    id: 'demo-1',
    title: 'Honda CD 70 Dream',
    price: 115000,
    city: 'Quetta',
    area: 'Sariab Road',
    condition: 'used',
    brand: 'Honda',
    model_year: 2022,
    cc: '70',
    description: 'Bike is in pristine condition. First owner, maintained exclusively at Honda authorized service centers. Tyres are like new, recently tuned up. Only used for commuting within Quetta city.',
    phone: '03001234567',
    whatsapp: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAkqAYvxtLGgNC3Bvb9t00nJ-sBcycN9_SGnXiilptzakWqWic6b9wa_Babe83Wr2iNU_z62VX5eZwoIrbBzmrlRJcLSbpF2uCRNnANPTcbKnyCsjRHAQCx2ZHSKpfqTmGjMR5VcHleeZ-rZAENfAKDJBTznPA3CBvN6btZpQ-Z0sI-DhOB0yqj2uh_GnIkYxCEq5kTag8EjJVW3DhGPufXV3GIsH0yVaeHAc8X2xkfz_YbuFJds2a6YwbyOujkXRrYdjb91bZRBwI'],
  },
  'demo-2': {
    id: 'demo-2',
    title: 'Yamaha YBR 125G',
    price: 435000,
    city: 'Gwadar',
    area: 'Cantt',
    condition: 'new',
    brand: 'Yamaha',
    model_year: 2024,
    cc: '125',
    description: 'Brand new Yamaha YBR 125G. Zero meter, never ridden. Full documents available.',
    phone: '03009876543',
    whatsapp: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCXXiE-fYZC61vQfVNXymO6VC3pKYgKjwZTNHWlsDOeAjChJR6HXn4Bg5hIabbikWFDpsQtXUBWNW4BYTxMtBftk--Lf5aF1lNm2NlTb_IVy8D1OqaoBInoa7yJ1gzoFS0V-bcnvCZrUiYSTPK_xCk8-IGYd9A-47nrPBj0hSlR3tJAiI7ztjBCGIDSL0LHva6CAYiK9kLiH2UYmLELhRbaWBv83vcQ19wYGx-tA3EB8fJq42wz-C7_zmN98OpTet1X2ec6Gm4cqzM'],
  },
  'demo-3': {
    id: 'demo-3',
    title: 'Suzuki GD 110S',
    price: 210000,
    city: 'Turbat',
    area: 'Main Bazar',
    condition: 'used',
    brand: 'Suzuki',
    model_year: 2021,
    cc: '110',
    description: 'Well maintained Suzuki GD 110S. Minor scratches but mechanically perfect. Documents complete.',
    phone: '03331234567',
    whatsapp: false,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBqPIwx2fu-k7PiVMISHB_zgjgjiF21RWUigGrP0TMzvfcVR46eQ5ytgtvq2iKjz7nLSTHifdVwxwy20EKcOMWXiyFZB3knifrucdj9Y5cZhsoLBXSY9EAvduYVMmIi0wWUHxf6GHAowX0JYnY8L3nn2bPpK0sUD8n6KIZV2xW_xoCvQD-BKswTcTr3lOuDSc9bOEbnhlDMXUFd1AxcOekOnlAGApo-_MGAMr2_IsJ8J_f_7wBTIL8OR5r6g4UcseEBsw3ziMaaNM0'],
  },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

const BikeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const { isAdmin } = useAuth();
  const [sellerProfile, setSellerProfile] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBike();
    setActiveImage(0);
  }, [id]);

  const fetchBike = async () => {
    setLoading(true);

    // Check for demo bikes first
    if (id.startsWith('demo-')) {
      setBike(DEMO_BIKES[id] || null);
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'bike_listings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const bikeData = { id: docSnap.id, ...docSnap.data() };
        setBike(bikeData);
        
        // Fetch seller profile
        if (bikeData.user_id) {
          try {
            const profileSnap = await getDoc(doc(db, 'profiles', bikeData.user_id));
            if (profileSnap.exists()) {
              setSellerProfile(profileSnap.data());
            }
          } catch (profileErr) {
            console.error('Error fetching seller profile:', profileErr);
          }
        }
      } else {
        setBike(null);
      }
    } catch (error) {
      console.error('Error fetching bike details:', error);
      setBike(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('ADMIN ACTION: Are you sure you want to delete this listing? This cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'bike_listings', id));
      alert('Listing deleted successfully');
      navigate('/browse');
    } catch (err) {
      alert('Failed to delete listing: ' + err.message);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="pt-24 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-8 space-y-6">
            <div className="aspect-video bg-surface-container-high rounded-3xl" />
            <div className="flex gap-3">
              {[1,2,3].map(i => <div key={i} className="w-24 h-24 bg-surface-container-high rounded-2xl" />)}
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-3xl space-y-4">
              <div className="h-8 bg-surface-container-high rounded-xl w-3/4" />
              <div className="h-5 bg-surface-container-high rounded-xl w-1/2" />
              <div className="h-10 bg-surface-container-high rounded-xl w-1/3" />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-surface-container-lowest p-6 rounded-3xl space-y-4">
              <div className="h-16 bg-surface-container-high rounded-2xl" />
              <div className="h-12 bg-surface-container-high rounded-2xl" />
              <div className="h-12 bg-surface-container-high rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!bike) {
    return (
      <main className="pt-28 pb-32 px-6 max-w-2xl mx-auto text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant">search_off</span>
        <h1 className="font-headline text-3xl font-bold mt-4 mb-2 text-on-background">Listing not found</h1>
        <p className="text-on-surface-variant mb-8">This ad may have been removed or expired.</p>
        <Link to="/browse" className="px-8 py-4 bg-primary text-white rounded-full font-bold">Browse All Bikes</Link>
      </main>
    );
  }

  const photos = (bike.photos && bike.photos.length > 0) ? bike.photos : [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB1Aj7LFEMH_2peS4hvo66HM2Jzv3JWxzUuTQDJZSn4FCQ91aQC5Dfdtg-lTTlu1pZNzyy9MMQevRAI-VDFk_qbtf3tT093U54362HXYbC8OUREsnnxFNA2gNt6OAr7HLJlfQlMdmVwd7h6TMl5RUPmsTKgqmkBknKnvR_qz6CSeOA-yy-QDyN-Dk5zvi6pH5OhMM7jmU4p3elRrs2vJIQZlJQIbiXMkHjlzJrkW38N5i7jrnp0bSRM7rmBdXrJ5D0toh0Ni_aHT8M',
  ];

  const specs = [
    bike.cc && { icon: 'settings', label: 'Engine', value: `${bike.cc}cc` },
    bike.model_year && { icon: 'calendar_today', label: 'Year', value: bike.model_year },
    { icon: 'verified_user', label: 'Condition', value: bike.condition === 'new' ? 'New' : 'Used' },
    bike.brand && { icon: 'directions_bike', label: 'Brand', value: bike.brand },
    { icon: 'location_on', label: 'City', value: bike.city },
    bike.area && { icon: 'place', label: 'Area', value: bike.area },
  ].filter(Boolean);

  return (
    <main className="pt-16 md:pt-24 pb-32 md:pb-24 max-w-7xl mx-auto">
      {/* Back navigation */}
      <div className="px-4 md:px-6 pt-4 md:pt-0 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary font-semibold transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 px-4 md:px-6">
        {/* Left: Gallery + Details */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">

          {/* Photo Gallery */}
          <section className="space-y-2 md:space-y-4">
            <div className="relative aspect-[4/3] md:aspect-[16/9] bg-surface-container rounded-2xl md:rounded-3xl overflow-hidden group">
              <img
                alt={bike.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                src={getOptimizedImageUrl(photos[activeImage], 'w_1080,f_auto,q_auto')}
                onError={e => { e.target.src = photos[0]; }}
              />
              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${bike.condition === 'new' ? 'bg-primary/90 text-white' : 'bg-white/70 text-on-surface'}`}>
                  {bike.condition === 'new' ? '✨ New' : '✓ Used'}
                </span>
              </div>
              {photos.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(i => Math.max(0, i - 1))}
                    className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button onClick={() => setActiveImage(i => Math.min(photos.length - 1, i + 1))}
                    className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                  {/* Dot indicators on mobile */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                    {photos.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveImage(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${activeImage === idx ? 'bg-white w-4' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails — desktop only */}
            {photos.length > 1 && (
              <div className="hidden md:flex gap-3 overflow-x-auto pb-1">
                {photos.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(idx)}
                    className={`min-w-[90px] h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all ${activeImage === idx ? 'ring-4 ring-primary' : 'opacity-60 hover:opacity-100'}`}>
                    <img className="w-full h-full object-cover" src={getOptimizedImageUrl(img, 'w_200,f_auto,q_auto')} alt={`Photo ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Title + Price */}
          <section className="bg-surface-container-lowest p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-tight">{bike.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-on-surface-variant text-xs md:text-sm">
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined" style={{fontSize:'14px'}}>location_on</span>
                    {bike.area ? `${bike.area}, ` : ''}{bike.city}{bike.province ? `, ${bike.province}` : ''}
                  </span>
                  <span className="text-outline-variant">·</span>
                  <span>{timeAgo(bike.created_at)}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xl md:text-3xl font-headline font-black text-primary">
                  Rs {Number(bike.price).toLocaleString()}
                </div>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">Negotiable</span>
              </div>
            </div>

            {specs.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-5 pt-4 border-t border-surface-container">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined" style={{fontSize:'16px'}}>{spec.icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs text-on-surface-variant font-semibold">{spec.label}</p>
                      <p className="font-bold text-on-surface text-xs md:text-sm">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Contact — visible inline on mobile between specs and description */}
          <section className="md:hidden bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
                style={!sellerProfile?.photo_url ? { background: 'linear-gradient(135deg, #25d366, #128c7e)' } : {}}>
                {sellerProfile?.photo_url ? (
                  <img src={sellerProfile.photo_url} alt="Seller" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-xl text-white">person</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-headline font-extrabold flex items-center gap-1.5">
                  {sellerProfile?.full_name || 'Private Seller'}
                  {sellerProfile?.is_verified && (
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  )}
                </h4>
                <p className="text-xs text-on-surface-variant font-medium">{bike.city}{bike.province ? `, ${bike.province}` : ''}</p>
              </div>
            </div>
            {bike.whatsapp && (
              <a href={`https://wa.me/92${bike.phone?.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm">
                <span className="material-symbols-outlined text-lg">chat</span>
                Chat on WhatsApp
              </a>
            )}
            <button onClick={() => setShowPhone(p => !p)}
              className="w-full bg-surface-container-high py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm">
              <span className="material-symbols-outlined text-lg">call</span>
              {showPhone ? bike.phone : 'Show Phone Number'}
            </button>

            {isAdmin && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full bg-error/10 text-error py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm border border-error/20"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                {isDeleting ? 'Deleting...' : 'Delete Listing (Admin)'}
              </button>
            )}
          </section>

          {/* Description */}
          {bike.description && (
            <section className="bg-surface-container-low p-4 md:p-8 rounded-2xl md:rounded-3xl">
              <h2 className="text-base md:text-xl font-headline font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{fontSize:'18px'}}>description</span>
                Seller's Description
              </h2>
              <p className="text-on-surface-variant leading-relaxed whitespace-pre-line text-sm md:text-base">{bike.description}</p>
            </section>
          )}

          {/* Safety Tips */}
          <section className="bg-error-container/20 p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-start gap-3">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-error text-on-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-base md:text-xl">security</span>
            </div>
            <div>
              <h3 className="font-bold text-on-error-container text-sm md:text-base">Buying Safety Tips</h3>
              <ul className="text-xs md:text-sm text-on-error-container mt-1 space-y-1 opacity-90">
                <li>• Inspect the bike in person before making payments.</li>
                <li>• Meet in a public place like a market or fuel station.</li>
                <li>• Verify engine & chassis numbers with registration papers.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Right: Seller Contact — DESKTOP only */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24 space-y-5">
            <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-high">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-md"
                  style={!sellerProfile?.photo_url ? { background: 'linear-gradient(135deg, #25d366, #128c7e)' } : {}}>
                  {sellerProfile?.photo_url ? (
                    <img src={sellerProfile.photo_url} alt="Seller" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-white font-bold">person</span>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-headline font-extrabold text-on-surface flex items-center gap-1.5">
                    {sellerProfile?.full_name || 'Private Seller'}
                    {sellerProfile?.is_verified && (
                      <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    )}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-medium">{bike.city}{bike.province ? `, ${bike.province}` : ''}</p>
                </div>
              </div>
              <div className="space-y-3">
                {bike.whatsapp && (
                  <a href={`https://wa.me/92${bike.phone?.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-2xl font-headline font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                    <span className="material-symbols-outlined">chat</span>
                    Chat on WhatsApp
                  </a>
                )}
                <button onClick={() => setShowPhone(p => !p)}
                  className="w-full bg-surface-container-highest text-on-surface py-4 rounded-2xl font-headline font-bold flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">call</span>
                  {showPhone ? bike.phone : 'Show Phone Number'}
                </button>
              </div>

              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-outline-variant/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-error mb-3">Admin Actions</p>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full bg-error text-white py-4 rounded-2xl font-headline font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all hover:bg-red-700 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">delete</span>
                    {isDeleting ? 'Deleting...' : 'Delete Listing'}
                  </button>
                </div>
              )}
            </section>

            <section className="bg-surface-container-low p-5 rounded-3xl text-sm text-on-surface-variant space-y-3">
              <p className="flex items-center gap-2 font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                {bike.area ? `${bike.area}, ` : ''}{bike.city}{bike.province ? `, ${bike.province}` : ''}
              </p>
              {bike.created_at && (
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  Listed {timeAgo(bike.created_at)}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BikeDetail;

