import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const ProfileSetup = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: 'Quetta',
  });

  // Pre-fill from auth metadata if available
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
      }));
    }
  }, [user]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.city) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          onboarded: true,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Refresh profile in context and go home
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4" 
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.03)' }}>
        
        {/* Background shapes */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

        <header className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-primary to-primary-container rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_celebrate</span>
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 mb-2 tracking-tight">One last step!</h1>
          <p className="text-slate-500 font-medium">Please complete your profile details to start selling on PakBikes.</p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-semibold">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Full Name</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
              <input
                type="text" name="full_name" value={form.full_name} onChange={handleChange}
                placeholder="John Doe" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Mobile Number</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">call</span>
              <input
                type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="0300 1234567" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Your City</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                style={{ zIndex: 10 }}>location_on</span>
              <select
                name="city" value={form.city} onChange={handleChange}
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-900 appearance-none relative"
              >
                {['Quetta', 'Turbat', 'Gwadar', 'Khuzdar', 'Chaman', 'Sibi', 'Hub', 'Zhob', 'Pishin', 'Loralai'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-headline font-extrabold text-lg shadow-[0_12px_24px_rgba(37,211,102,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Finish Setup
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-xs font-semibold px-4">
          By completing your profile, you help build a trusted community for motorcycle lovers in Balochistan.
        </p>
      </div>
    </div>
  );
};

export default ProfileSetup;
