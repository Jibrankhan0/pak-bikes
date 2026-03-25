import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';

const ProfileSetup = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [photo, setPhoto] = useState({
    file: null,
    preview: profile?.photo_url || '',
    uploading: false
  });

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    province: 'Balochistan',
    city: 'Quetta',
    area: '',
  });

  // Pre-fill from existing profile or auth data
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        full_name: profile?.full_name || user.displayName || '',
        phone: profile?.phone || '',
        province: profile?.province || 'Balochistan',
        city: profile?.city || 'Quetta',
        area: profile?.area || ''
      }));
      if (profile?.photo_url) {
        setPhoto(prev => ({ ...prev, preview: profile.photo_url }));
      }
    }
  }, [user, profile]);

  // If already onboarded, send them home
  useEffect(() => {
    if (profile?.onboarded) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo too large. Please select an image under 5MB.');
      return;
    }

    setPhoto({
      file,
      preview: URL.createObjectURL(file),
      uploading: false
    });
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Photo upload failed');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.city) {
      setError('Please fill in essential fields: Name, Phone, and City.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user?.uid) throw new Error('User not authenticated');

      let photo_url = profile?.photo_url || '';
      
      // Upload photo if a new one was selected
      if (photo.file) {
        setPhoto(prev => ({ ...prev, uploading: true }));
        photo_url = await uploadToCloudinary(photo.file);
      }

      // Save Profile to Firestore
      await setDoc(doc(db, 'profiles', user.uid), {
        full_name: form.full_name,
        phone: form.phone,
        province: form.province,
        city: form.city,
        area: form.area,
        photo_url,
        onboarded: true,
        updated_at: new Date().toISOString(),
      }, { merge: true });

      await refreshProfile();
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
      setPhoto(prev => ({ ...prev, uploading: false }));
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4" 
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full -ml-16 -mb-16 blur-2xl" />

        <header className="text-center mb-10 relative z-10">
          <h1 className="text-3xl font-headline font-black text-slate-900 mb-2 tracking-tight">Complete Profile</h1>
          <p className="text-slate-500 font-medium">Add your details to start buying and selling.</p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center mb-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center cursor-pointer group hover:border-primary/20 transition-all overflow-hidden"
            >
              {photo.preview ? (
                <img src={photo.preview} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl md:text-4xl">add_a_photo</span>
                </div>
              )}
              
              {photo.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all">edit</span>
              </div>
            </div>
            <input 
              ref={fileInputRef} type="file" accept="image/*" 
              className="hidden" onChange={handlePhotoSelect} 
            />
            <p className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Profile Photo (Optional)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Name *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 shrink-0">person</span>
                <input
                  type="text" name="full_name" value={form.full_name} onChange={handleChange}
                  placeholder="e.g. Ali Ahmed" required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/30 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Phone Number *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">call</span>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="0300 1234567" required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/30 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Province</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">map</span>
                <select
                  name="province" value={form.province} onChange={handleChange}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-900 appearance-none relative"
                >
                  {['Balochistan', 'Sindh', 'Punjab', 'KPK', 'Gilgit-Baltistan', 'Azad Kashmir'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">City *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">location_on</span>
                <select
                  name="city" value={form.city} onChange={handleChange}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-900 appearance-none relative"
                >
                  {['Quetta', 'Turbat', 'Gwadar', 'Khuzdar', 'Chaman', 'Sibi', 'Hub', 'Zhob', 'Pishin', 'Loralai'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Area */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Specific Area (Neighbourhood)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">home_pin</span>
                <input
                  type="text" name="area" value={form.area} onChange={handleChange}
                  placeholder="e.g. Satellite Town, Airport Road"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-5 mt-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-headline font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Finish Setup
                <span className="material-symbols-outlined">check_circle</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest px-4">
          Verified profiles sell bikes 3x faster in Balochistan.
        </p>
      </div>
    </div>
  );
};

export default ProfileSetup;
