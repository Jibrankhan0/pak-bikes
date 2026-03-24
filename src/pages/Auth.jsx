import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const resetForm = (newTab) => {
    setTab(newTab); setStep('form'); setError('');
    setOtp(['', '', '', '', '', '', '', '']);
  };

  // ── Sign In ──
  const handleSignIn = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Sign Up → sends OTP to email if confirmation enabled ──
  const handleSignUp = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, phone } },
      });
      if (error) throw error;

      // If email confirmation is OFF → session exists → auto logged in
      if (data.session) {
        navigate(from, { replace: true });
      } else {
        // Email confirmation is ON → show OTP screen
        setStep('otp');
        setResendTimer(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Verify OTP (signup confirmation) ──
  const handleVerifyOtp = async (code) => {
    setError(''); setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
      if (error) throw error;
      
      // After signup confirmation, always go to profile-setup
      navigate('/profile-setup', { replace: true });
    } catch (err) {
      setError('Invalid or expired code. Try again.');
      setOtp(['', '', '', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(''); setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResendTimer(60);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next); setError('');
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every(d => d !== '')) handleVerifyOtp(next.join(''));
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (text.length === 8) {
      setOtp(text.split(''));
      otpRefs.current[7]?.focus();
      handleVerifyOtp(text);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0f2b1a 50%, #0a1628 100%)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>directions_bike</span>
          </div>
          <span className="text-white font-black text-lg font-headline">PakBikes</span>
        </Link>
        <Link to="/" className="text-white/50 hover:text-white transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm">

          {/* ── OTP Verification Step ── */}
          {step === 'otp' ? (
            <>
              <button onClick={() => { setStep('form'); setOtp(['','','','','','']); setError(''); }}
                className="flex items-center gap-1 text-white/50 hover:text-white transition-colors mb-6 text-sm">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>Back
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>mark_email_read</span>
                </div>
                <h1 className="text-2xl font-headline font-extrabold text-white mb-2">Enter OTP Code</h1>
                <p className="text-white/50 text-sm">
                  We sent a 6-digit code to<br />
                  <span className="text-white font-bold">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="material-symbols-outlined text-red-400 shrink-0" style={{ fontSize: '18px' }}>error</span>
                  <span className="text-red-300">{error}</span>
                </div>
              )}

              <div className="flex gap-1.5 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className="w-12 h-14 text-center text-xl font-extrabold text-white rounded-2xl outline-none transition-all"
                    style={{
                      background: digit ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.08)',
                      border: digit ? '2px solid rgba(37,211,102,0.6)' : '1px solid rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-4">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                  Verifying...
                </div>
              )}

              <div className="text-center">
                {resendTimer > 0
                  ? <p className="text-white/30 text-sm">Resend in <span className="text-white/60 font-bold">{resendTimer}s</span></p>
                  : <button onClick={handleResend} disabled={loading}
                      className="text-primary font-bold text-sm hover:underline">Resend Code</button>
                }
              </div>
            </>
          ) : (
            /* ── Sign In / Sign Up Form ── */
            <>
              <div className="text-center mb-7">
                <h1 className="text-3xl font-headline font-extrabold text-white mb-1">
                  {tab === 'signin' ? 'Welcome Back' : 'Join PakBikes'}
                </h1>
                <p className="text-white/50 text-sm">
                  {tab === 'signin' ? 'Sign in to post and manage your ads' : 'Create a free account to start selling'}
                </p>
              </div>

              {/* Tab switcher */}
              <div className="flex mb-5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {['signin', 'signup'].map(t => (
                  <button key={t} onClick={() => resetForm(t)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={tab === t ? {
                      background: 'linear-gradient(135deg, #25d366, #128c7e)',
                      color: 'white', boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                    } : { color: 'rgba(255,255,255,0.5)' }}>
                    {t === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-sm"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="material-symbols-outlined text-red-400 shrink-0" style={{ fontSize: '18px' }}>error</span>
                  <span className="text-red-300">{error}</span>
                </div>
              )}

              <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="flex flex-col gap-3">
                {tab === 'signup' && (
                  <>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" style={{ fontSize: '20px' }}>person</span>
                      <input type="text" placeholder="Full Name" value={name}
                        onChange={e => setName(e.target.value)} required
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 outline-none text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" style={{ fontSize: '20px' }}>phone</span>
                      <input type="tel" placeholder="Phone (e.g. 0300 1234567)" value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 outline-none text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                    </div>
                  </>
                )}

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" style={{ fontSize: '20px' }}>mail</span>
                  <input type="email" placeholder="Email Address" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 outline-none text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" style={{ fontSize: '20px' }}>lock</span>
                  <input type={showPass ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-white placeholder:text-white/30 outline-none text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className="mt-1 w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: loading ? 'rgba(37,211,102,0.5)' : 'linear-gradient(135deg, #25d366, #128c7e)',
                    boxShadow: loading ? 'none' : '0 6px 20px rgba(37,211,102,0.4)',
                  }}>
                  {loading
                    ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                          {tab === 'signin' ? 'login' : 'person_add'}
                        </span>
                        {tab === 'signin' ? 'Sign In' : 'Create Account'}
                      </>
                  }
                </button>
              </form>

              <p className="text-center text-white/30 text-xs mt-5 leading-relaxed">
                By continuing you agree to PakBikes{' '}
                <span className="text-white/50 underline cursor-pointer">Terms</span> &amp;{' '}
                <span className="text-white/50 underline cursor-pointer">Privacy Policy</span>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Auth;
