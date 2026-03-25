import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseClient';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';

const MAX_PHOTOS = 5;

const Sell = () => {
  const { user, emailVerified } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]); // { file, preview, url, uploading, error }
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    brand: '',
    year: '',
    cc: '',
    condition: 'used',
    price: '',
    description: '',
    city: 'Quetta',
    area: '',
    phone: '',
    whatsapp: true,
  });

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

// 5MB limit to stay within Cloudinary free tier safely
const MAX_SIZE = 5 * 1024 * 1024; 

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);

    // Filter large files
    const tooLarge = toAdd.filter(f => f.size > MAX_SIZE);
    if (tooLarge.length > 0) {
      alert(`Some files are too large (max 5MB). Please resize them.`);
    }

    const validFiles = toAdd.filter(f => f.size <= MAX_SIZE);
    if (!validFiles.length) return;

    const newPhotos = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      url: null,
      uploading: true,
      error: null,
      id: `${Date.now()}-${Math.random()}`,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);

    // Upload all files to Cloudinary in parallel
    const uploadPromises = newPhotos.map(async (photo) => {
      try {
        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();

        setPhotos(prev =>
          prev.map(p => p.id === photo.id ? { ...p, uploading: false, url: data.secure_url } : p)
        );
      } catch (err) {
        console.error('Cloudinary Upload Error:', err);
        setPhotos(prev =>
          prev.map(p => p.id === photo.id ? { ...p, uploading: false, error: 'Upload failed' } : p)
        );
      }
    });

    await Promise.all(uploadPromises);
    // Reset input so selecting same file again works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uploadedPhotos = photos.filter(p => p.url);
    if (!form.title || !form.price || !form.phone) {
      alert('Please fill in the required fields: Title, Price, and Phone.');
      return;
    }
    setSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, 'bike_listings'), {
        user_id: user.uid,
        title: form.title,
        brand: form.brand || null,
        model_year: form.year ? parseInt(form.year) : null,
        cc: form.cc || null,
        condition: form.condition,
        price: parseFloat(form.price),
        description: form.description || null,
        city: form.city,
        area: form.area || null,
        phone: form.phone,
        whatsapp: form.whatsapp,
        photos: uploadedPhotos.map(p => p.url),
        status: 'active',
        created_at: new Date().toISOString(),
      });
      
      setSubmitting(false);
      navigate(`/bike/${docRef.id}`);
    } catch (error) {
      setSubmitting(false);
      alert('Failed to post listing. Please try again.\n' + error.message);
    }
  };

  if (!emailVerified) {
    return (
      <main className="pt-32 pb-32 px-4 max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 rounded-[32px] bg-primary/10 flex items-center justify-center mx-auto mb-8 animate-pulse">
          <span className="material-symbols-outlined text-5xl text-primary">verified_user</span>
        </div>
        <h1 className="font-headline text-4xl font-extrabold text-on-background mb-4">Verify Your Email</h1>
        <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">
          To maintain a safe community, we require all sellers to verify their email address before posting ads.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-headline font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Check Verification Status
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-surface-container-high text-on-surface rounded-2xl font-headline font-bold hover:bg-surface-container-highest transition-all"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="pt-28 pb-32 px-4 max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 rounded-full bg-primary-container/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="font-headline text-4xl font-extrabold text-on-background mb-4">Ad Posted!</h1>
        <p className="text-on-surface-variant text-lg mb-8">Your bike listing is live. Buyers can now contact you directly.</p>
        <button
          onClick={() => { setSubmitted(false); setPhotos([]); setForm({ title:'', brand:'', year:'', cc:'', condition:'used', price:'', description:'', city:'Quetta', area:'', phone:'', whatsapp: true }); }}
          className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-headline font-bold shadow-lg"
        >
          Post Another Bike
        </button>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-32 px-4 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
          Sell Your Ride
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          Fill in the details below to showcase your bike to thousands of potential buyers across Balochistan.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photos Section */}
        <section className="bg-surface-container-low p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">add_a_photo</span>
            <h2 className="font-headline text-xl font-bold">Bike Photos</h2>
            <span className="ml-auto text-sm text-secondary font-medium">{photos.length} / {MAX_PHOTOS}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-highest">
                <img src={photo.preview} alt="preview" className="w-full h-full object-cover" />
                {photo.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {photo.error && (
                  <div className="absolute inset-0 bg-error/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-error">error</span>
                  </div>
                )}
                {photo.url && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1", fontSize: '12px' }}>check</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-error transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`${photos.length === 0 ? 'col-span-2 md:col-span-2 aspect-video' : 'aspect-square'} rounded-2xl bg-surface-container-highest border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-high hover:border-primary/40 transition-all group`}
              >
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 group-hover:text-primary group-hover:scale-110 transition-all">cloud_upload</span>
                <p className="text-sm font-bold text-on-surface-variant group-hover:text-primary">
                  {photos.length === 0 ? 'Upload Photos' : 'Add More'}
                </p>
                {photos.length === 0 && (
                  <p className="text-xs text-secondary mt-1">JPEG, PNG, WEBP up to 10MB</p>
                )}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="mt-4 text-xs text-secondary italic">
            Tip: Bright, clear photos of the engine and front view sell faster.
          </p>
        </section>

        {/* Basic Details */}
        <section className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary">info</span>
            <h2 className="font-headline text-xl font-bold">General Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Bike Title *</label>
              <input
                name="title" value={form.title} onChange={handleFormChange}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                placeholder="e.g. Honda CD 70 2023 - Mint Condition"
                type="text" required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Brand</label>
              <select name="brand" value={form.brand} onChange={handleFormChange}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none appearance-none">
                <option value="">Select Brand</option>
                {['Honda', 'Yamaha', 'Suzuki', 'United', 'Road Prince', 'Ravi', 'Other'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Model Year</label>
              <input name="year" value={form.year} onChange={handleFormChange}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                placeholder="2024" type="number" min="1990" max="2026"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Engine (CC)</label>
              <input name="cc" value={form.cc} onChange={handleFormChange}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                placeholder="70, 125, 150..." type="text"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Condition</label>
              <div className="flex gap-4">
                {['new', 'used'].map(c => (
                  <label key={c} className="flex-1 cursor-pointer">
                    <input className="sr-only peer" name="condition" type="radio" value={c}
                      checked={form.condition === c} onChange={handleFormChange} />
                    <div className="w-full py-3 text-center rounded-xl bg-surface-container-high peer-checked:bg-primary peer-checked:text-white transition-all font-semibold capitalize">{c}</div>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Price (PKR) *</label>
              <div className="relative">
                <input
                  name="price" value={form.price} onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-xl font-bold"
                  placeholder="0" type="number" required min="0"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">Rs</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Description</label>
              <textarea
                name="description" value={form.description} onChange={handleFormChange}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none resize-none"
                placeholder="Describe your bike's condition, features, and history..."
                rows="5"
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary">location_on</span>
            <h2 className="font-headline text-xl font-bold">Location Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">City</label>
              <select name="city" value={form.city} onChange={handleFormChange}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none appearance-none">
                {['Quetta', 'Turbat', 'Gwadar', 'Khuzdar', 'Chaman', 'Sibi', 'Hub', 'Zhob'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Area / Neighbourhood</label>
              <input name="area" value={form.area} onChange={handleFormChange}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                placeholder="e.g. Satellite Town, Airport Road" type="text"
              />
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-surface-container-low p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary">contact_phone</span>
            <h2 className="font-headline text-xl font-bold">Contact Information</h2>
          </div>
          <div className="max-w-md">
            <label className="block text-sm font-semibold mb-2 ml-1 text-on-surface-variant">Mobile Number *</label>
            <input name="phone" value={form.phone} onChange={handleFormChange}
              className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all outline-none mb-4"
              placeholder="03XX XXXXXXX" type="tel" required
            />
            <label className="flex items-center gap-3 p-4 rounded-xl bg-primary-container/10 cursor-pointer border border-primary-container/20">
              <input name="whatsapp" type="checkbox" checked={form.whatsapp} onChange={handleFormChange}
                className="w-5 h-5 rounded text-primary focus:ring-primary-container border-outline"
              />
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                <span className="text-sm font-semibold text-on-primary-container">Use my number for WhatsApp</span>
              </div>
            </label>
          </div>
        </section>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-headline font-extrabold text-xl shadow-[0_20px_40px_rgba(37,211,102,0.25)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                Post My Ad
                <span className="material-symbols-outlined">send</span>
              </>
            )}
          </button>
          <p className="mt-6 text-on-surface-variant text-sm">
            By clicking "Post My Ad", you agree to PakBikes'{' '}
            <a className="text-primary font-bold underline" href="#">Terms of Use</a> and{' '}
            <a className="text-primary font-bold underline" href="#">Privacy Policy</a>.
          </p>
        </div>
      </form>
    </main>
  );
};

export default Sell;
