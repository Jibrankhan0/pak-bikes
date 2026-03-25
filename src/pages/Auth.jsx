import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebaseClient';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { useAuth } from '../context/useAuth';

const Auth = () => {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupPassword, setSignupPassword] = useState(''); // Separate state for signup
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false); // New state for resending
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { user, emailVerified, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // 2. Already logged in?
  useEffect(() => { 
    if (user) {
      if (emailVerified) {
        navigate(from, { replace: true }); 
      } else {
        // Logged in but not verified -> Stay on auth page and show the "Verification Sent" state
        setSent(true);
      }
    }
  }, [user, emailVerified, navigate, from]);

  const resetForm = (newTab) => {
    setTab(newTab); setError(''); setSent(false); setSignupPassword(''); setPassword('');
  };

  // 3. Sign In (Simple)
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please fill in all fields.');
    setError(''); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Sign Up (Standard Email/Password + Verification)
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !signupPassword) return setError('Please fill in all fields.');
    if (signupPassword.length < 6) return setError('Password must be at least 6 characters.');
    
    setError(''); setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, signupPassword);
      // Send verification email
      await sendEmailVerification(userCredential.user);
      setSent(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) return setError('No user found. Please sign up again.');
    setError(''); setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      alert('Verification email sent to ' + auth.currentUser.email);
    } catch (err) {
      setError('Too many requests. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      await refreshUser();
      if (auth.currentUser?.emailVerified) {
        navigate('/profile-setup');
      } else {
        alert('Email not verified yet. Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to refresh status.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center" 
        style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0f2b1a 50%, #0a1628 100%)' }}>
        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
          <span className="material-symbols-outlined text-primary text-4xl">mail</span>
        </div>
        <h1 className="text-3xl font-headline font-extrabold text-white mb-3">Verification Sent!</h1>
        <p className="text-white/60 mb-8 max-w-xs">
          A verification email has been sent to <strong>{email}</strong>. 
          Please click it to verify your account. You can continue setting up your profile now.
        </p>
        <button onClick={handleCheckStatus} disabled={loading}
          className="mt-4 w-full max-w-xs py-4 bg-white text-[#0f2b1a] rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-5 h-5 border-2 border-[#0f2b1a] border-t-transparent rounded-full animate-spin" /> : 'I\'ve Verified (Check Status)'}
        </button>
        
        <button onClick={() => navigate('/profile-setup')} 
          className="mt-3 w-full max-w-xs py-3 bg-transparent text-white/70 border border-white/20 rounded-2xl font-bold hover:bg-white/5 transition-all">
          Skip to Profile Setup
        </button>
        
        <div className="mt-8 flex flex-col gap-3">
          <p className="text-white/40 text-sm">Didn't receive the email?</p>
          <button onClick={handleResend} disabled={resending}
            className="text-primary font-bold hover:underline disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>
          <button onClick={() => setSent(false)} className="mt-4 text-white/50 text-sm hover:underline">
            Go back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0f2b1a 50%, #0a1628 100%)' }}>
      <div className="flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>directions_bike</span>
          </div>
          <span className="text-white font-black text-lg font-headline text-shadow-sm">PakBikes</span>
        </Link>
        <Link to="/" className="text-white/50 hover:text-white transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-7">
            <h1 className="text-3xl font-headline font-extrabold text-white mb-2">
              {tab === 'signin' ? 'Welcome Back' : 'Verify Email'}
            </h1>
            <p className="text-white/50 text-sm">
              {tab === 'signin' ? 'Enter your details to log in' : 'Create an account to start selling bikes'}
            </p>
          </div>

          <div className="flex mb-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <button onClick={() => resetForm('signin')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={tab === 'signin' ? {
                background: 'linear-gradient(135deg, #25d366, #128c7e)',
                color: 'white', boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
              } : { color: 'rgba(255,255,255,0.5)' }}>
              Sign In
            </button>
            <button onClick={() => resetForm('signup')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={tab === 'signup' ? {
                background: 'linear-gradient(135deg, #25d366, #128c7e)',
                color: 'white', boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
              } : { color: 'rgba(255,255,255,0.5)' }}>
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span className="material-symbols-outlined text-red-400 shrink-0" style={{ fontSize: '18px' }}>error</span>
              <span className="text-red-300">{error}</span>
            </div>
          )}

          <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40" style={{ fontSize: '20px' }}>mail</span>
              <input type="email" placeholder="Email Address" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-white placeholder:text-white/30 outline-none text-base font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
            </div>

            {tab === 'signin' && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40" style={{ fontSize:20 }}>lock</span>
                <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl text-white placeholder:text-white/30 outline-none text-base font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize:20 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            )}

            {tab === 'signup' && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40" style={{ fontSize:20 }}>lock</span>
                <input type={showPass ? 'text' : 'password'} placeholder="Choose Password" value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)} required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl text-white placeholder:text-white/30 outline-none text-base font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize:20 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="mt-2 w-full py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
              style={{
                background: loading ? 'rgba(37,211,102,0.5)' : 'linear-gradient(135deg, #25d366, #128c7e)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(37,211,102,0.3)',
              }}>
              {loading
                ? <div className="w-6 h-6 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                : tab === 'signin' ? 'Log In' : 'Sign Up'
              }
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-8 cursor-default">
            {tab === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => resetForm('signup')} className="text-[#25d366] font-bold hover:underline">
                  Switch to Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => resetForm('signin')} className="text-[#25d366] font-bold hover:underline">
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
