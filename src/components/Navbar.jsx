import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // RELIABLE: Auto-close all menus on any route change
  useEffect(() => {
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isHome = location.pathname === '/';
  const transparent = isHome && !scrolled;

  const handleSignOut = async (e) => {
    if (e) e.stopPropagation();
    console.log('🔘 Sign out button clicked');
    
    // 1. Give immediate visual feedback by closing menus
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
    
    try {
      console.log('⌛ Calling signOut from context...');
      // AuthContext.signOut is aggressive and will trigger a page reload
      await signOut();
    } catch (err) {
      console.error('⚠️ Sign out failed:', err);
      // Nuclear fallback if the context call itself fails
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  // Get user initials
  const getInitials = () => {
    const name = profile?.full_name || user?.displayName || user?.email || '';
    const parts = name.split(/[\s@]/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
  };

  const navLinks = [
    { name: 'Buy', path: '/browse' },
    { name: 'Sell', path: '/sell' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={transparent ? {
          background: 'transparent',
          borderBottom: 'none',
          boxShadow: 'none',
        } : {
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(37,211,102,0.15)',
          boxShadow: '0 2px 24px rgba(0,0,0,0.08)',
        }}
      >
        <nav className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-headline tracking-tight">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>directions_bike</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className={`text-base md:text-xl font-black transition-colors duration-300 ${transparent ? 'text-white' : 'text-slate-900'}`}
                style={transparent ? { textShadow: '0 1px 8px rgba(0,0,0,0.4)' } : {}}>
                <span className="md:hidden">PakBikes</span>
                <span className="hidden md:inline">PakBikes Balochistan</span>
              </span>
              <span className={`text-[9px] font-semibold uppercase tracking-widest transition-colors duration-300 ${transparent ? 'text-white/70' : 'text-primary'}`}>
                Balochistan's #1 Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-8 font-headline font-bold tracking-tight">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path}
                className={`transition-colors duration-200 ${
                  location.pathname === link.path
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : transparent
                    ? 'text-white/90 hover:text-white'
                    : 'text-slate-600 hover:text-primary'
                }`}>
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {user ? (
              /* User avatar + dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setIsMobileMenuOpen(true);
                    } else {
                      setShowUserMenu(!showUserMenu);
                    }
                  }}
                  className="flex items-center gap-2 transition-all active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md overflow-hidden bg-slate-100"
                    style={!profile?.photo_url ? { background: 'linear-gradient(135deg, #25d366, #128c7e)' } : {}}>
                    {profile?.photo_url ? (
                      <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitials()
                    )}
                  </div>
                  <span className={`hidden md:block text-sm font-bold transition-colors ${transparent ? 'text-white' : 'text-slate-700'}`}>
                    {(profile?.full_name || user.displayName || '').split(' ')[0] || 'Me'}
                  </span>
                  <span className={`hidden md:block material-symbols-outlined text-sm transition-colors ${transparent ? 'text-white/70' : 'text-slate-400'}`} style={{ fontSize: '18px' }}>
                    {showUserMenu ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div className="hidden md:block absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200"
                    style={{ background: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-sm truncate">{profile?.full_name || user.displayName || 'User'}</p>
                      <p className="text-slate-400 text-xs truncate">{user.email}</p>
                    </div>
                    <Link to="/my-ads" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>list_alt</span>
                      My Listings
                    </Link>
                    <Link to="/profile-setup" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>person</span>
                      Profile Settings
                    </Link>
                    <Link to="/sell" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>add_circle</span>
                      Post an Ad
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-sm font-bold text-primary">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield_person</span>
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-sm font-medium text-red-500">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"
                  className={`hidden md:inline-flex items-center gap-1.5 text-sm font-bold transition-colors px-4 py-2 rounded-full ${transparent ? 'text-white/80 hover:text-white border border-white/30 hover:border-white/60' : 'text-slate-600 hover:text-primary'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                  Sign In
                </Link>
                <Link to="/sell"
                  className="hidden md:inline-flex items-center gap-2 text-white px-5 py-2 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 4px 14px rgba(37,211,102,0.35)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                  Post Your Bike
                </Link>
              </>
            )}

            <button
              className={`md:hidden p-2 rounded-xl transition-colors ${transparent ? 'text-white hover:bg-white/20' : 'text-slate-800 hover:bg-slate-100'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Side Drawer */}
      <div className={`md:hidden fixed inset-0 z-[100] transition-all duration-300 ${isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Drawer Content */}
        <div className={`absolute left-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary shrink-0 shadow-md">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>directions_bike</span>
              </div>
              <span className="text-xl font-black text-slate-900 font-headline italic">PakBikes</span>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-500">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-grow overflow-y-auto py-6 px-4 space-y-2">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                  location.pathname === link.path ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  {link.name === 'Buy' ? 'search' : link.name === 'Sell' ? 'add_circle' : 'contact_support'}
                </span>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="p-6 bg-slate-50 mt-auto">
            {!user ? (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-4 rounded-2xl bg-white border-2 border-primary/20 text-primary font-black flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined">login</span>
                Sign In
              </Link>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-white font-black text-lg overflow-hidden shadow-inner shrink-0"
                    style={!profile?.photo_url ? { background: 'linear-gradient(135deg, #25d366, #128c7e)' } : {}}>
                    {profile?.photo_url ? (
                      <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitials()
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="font-bold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-slate-400 text-xs truncate font-medium">{user.email}</p>
                  </div>
                </div>

                <Link to="/my-ads" onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold shadow-sm">
                  <span className="material-symbols-outlined text-primary">list_alt</span>
                  My Listings
                </Link>

                <Link to="/profile-setup" onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold shadow-sm">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Profile Settings
                </Link>

                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-primary/10 text-primary font-bold">
                    <span className="material-symbols-outlined">shield_person</span>
                    Admin Dashboard
                  </Link>
                )}

                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-50 text-red-500 font-bold transition-colors"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-5 pt-2 rounded-t-3xl z-50 transition-all shadow-[0_-4px_30px_rgba(0,0,0,0.1)] border-t border-slate-100"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <Link to="/"
          className={`flex flex-col items-center justify-center px-4 py-1.5 touch-manipulation active:scale-90 transition-all ${location.pathname === '/' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === '/' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px' }}>home</span>
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </Link>

        <Link to="/browse"
          className={`flex flex-col items-center justify-center px-4 py-1.5 touch-manipulation active:scale-90 transition-all ${location.pathname === '/browse' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === '/browse' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px' }}>search</span>
          <span className="text-[10px] font-bold mt-0.5">Browse</span>
        </Link>

        {/* Raised FAB Post button */}
        <Link to="/sell" className="flex flex-col items-center justify-center -mt-6 touch-manipulation active:scale-110 transition-transform">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
            style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 25px rgba(37,211,102,0.5)' }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>add</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-primary">Post</span>
        </Link>

        <Link 
          to="/contact"
          className={`flex flex-col items-center justify-center px-4 py-1.5 touch-manipulation active:scale-90 transition-transform ${location.pathname === '/contact' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === '/contact' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px' }}>chat</span>
          <span className="text-[10px] font-bold mt-0.5">Chat</span>
        </Link>

        {/* User / Login Tab redirects to Drawer or Login */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center px-4 py-1.5 touch-manipulation active:scale-90 transition-all ${isMobileMenuOpen ? 'text-primary' : 'text-slate-400'}`}>
          {user ? (
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[10px] overflow-hidden bg-slate-100"
              style={!profile?.photo_url ? { background: 'linear-gradient(135deg, #25d366, #128c7e)' } : {}}>
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>menu</span>
          )}
          <span className="text-[10px] font-bold mt-0.5">{user ? 'Me' : 'Menu'}</span>
        </button>
      </nav>


    </>
  );
};

export default Navbar;
