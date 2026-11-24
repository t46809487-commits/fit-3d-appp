import React, { useEffect, useRef, useState } from 'react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import {
  loginWithGoogleSafe,
  loginWithFacebook,
  loginAsGuest,
  createRecaptcha,
  sendPhoneOtp,
  authErrorMessage,
} from '../../firebase';

type View = 'choose' | 'phone' | 'otp';

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+92', label: '🇵🇰 +92' },
  { code: '+880', label: '🇧🇩 +880' },
  { code: '+977', label: '🇳🇵 +977' },
  { code: '+94', label: '🇱🇰 +94' },
];

const RESEND_SECONDS = 30;

export const LoginScreen: React.FC = () => {
  const [view, setView] = useState<View>('choose');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [country, setCountry] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Countdown for "Resend OTP"
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Clean up the invisible reCAPTCHA when leaving the screen
  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length < 7 || digits.length > 12) {
      setError('Sahi mobile number daalo (bina country code ke).');
      return;
    }
    setBusy(true);
    try {
      verifierRef.current?.clear();
      verifierRef.current = createRecaptcha('recaptcha-container');
      confirmationRef.current = await sendPhoneOtp(country + digits, verifierRef.current);
      setOtp('');
      setView('otp');
      setResendIn(RESEND_SECONDS);
    } catch (e) {
      setError(authErrorMessage(e));
      verifierRef.current?.clear();
      verifierRef.current = null;
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otp.length !== 6) {
      setError('6 ank ka OTP daalo.');
      return;
    }
    if (!confirmationRef.current) {
      setError('Pehle OTP mangao.');
      setView('phone');
      return;
    }
    setBusy(true);
    try {
      await confirmationRef.current.confirm(otp);
      // onAuthStateChanged in App.tsx now takes the user into the app
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const maskedPhone = (country + phone.replace(/\D/g, '').replace(/^0+/, '')).replace(/\d(?=\d{3})/g, '•');

  const btnBase =
    'w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-black transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/30">
            <span className="font-mono text-lg tracking-tighter">3D</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">FIT3D</h1>
          <p className="text-xs text-neutral-400">Workout shuru karne ke liye login karo</p>
        </div>

        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-5 space-y-3">
          {view === 'choose' && (
            <>
              <button
                disabled={busy}
                onClick={() => run(loginWithGoogleSafe)}
                className={`${btnBase} bg-white text-neutral-900 hover:bg-neutral-200`}
              >
                <span className="font-black text-base text-blue-600">G</span> Google se login
              </button>

              <button
                disabled={busy}
                onClick={() => run(loginWithFacebook)}
                className={`${btnBase} bg-[#1877F2] text-white hover:bg-[#1468d8]`}
              >
                <span className="font-black text-base">f</span> Facebook se login
              </button>

              <button
                disabled={busy}
                onClick={() => {
                  setError('');
                  setView('phone');
                }}
                className={`${btnBase} bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700`}
              >
                <span>📱</span> Mobile number (OTP)
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-neutral-800" />
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">ya</span>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>

              <button
                disabled={busy}
                onClick={() => run(loginAsGuest)}
                className={`${btnBase} bg-transparent text-neutral-300 hover:text-white border border-dashed border-neutral-700`}
              >
                Guest ke roop mein dekho
              </button>
              <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
                Guest sirf Explore dekh sakta hai. Workout chalane ke liye Google, Facebook ya mobile number se login zaroori hai.
              </p>
            </>
          )}

          {view === 'phone' && (
            <>
              <button
                onClick={() => {
                  setError('');
                  setView('choose');
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                ← Wapas
              </button>
              <h2 className="text-base font-black">Mobile number se login</h2>
              <p className="text-xs text-neutral-400">Hum is number par 6 ank ka OTP bhejenge.</p>

              <div className="flex gap-2">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-xl px-2 py-3 text-sm text-white"
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 14))}
                  className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                disabled={busy || phone.trim().length === 0}
                onClick={handleSendOtp}
                className={`${btnBase} bg-orange-500 text-white hover:bg-orange-600`}
              >
                {busy ? 'Bhej rahe hain...' : 'OTP bhejo'}
              </button>
            </>
          )}

          {view === 'otp' && (
            <>
              <button
                onClick={() => {
                  setError('');
                  setView('phone');
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                ← Number badlo
              </button>
              <h2 className="text-base font-black">OTP daalo</h2>
              <p className="text-xs text-neutral-400">
                {maskedPhone} par bheja gaya 6 ank ka OTP daalo.
              </p>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500"
              />

              <button
                disabled={busy || otp.length !== 6}
                onClick={handleVerifyOtp}
                className={`${btnBase} bg-orange-500 text-white hover:bg-orange-600`}
              >
                {busy ? 'Jaanch rahe hain...' : 'Verify karke login'}
              </button>

              <button
                disabled={busy || resendIn > 0}
                onClick={handleSendOtp}
                className="w-full text-xs text-neutral-400 hover:text-white disabled:opacity-50 disabled:hover:text-neutral-400"
              >
                {resendIn > 0 ? `Naya OTP ${resendIn} second mein` : 'OTP dobara bhejo'}
              </button>
            </>
          )}

          {error && (
            <div role="alert" className="rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <p className="text-[10px] text-neutral-600 text-center leading-relaxed">
          Login karke aap hamari Terms aur Privacy Policy se sehmat ho. Aapka OTP aur password hum kabhi save nahi karte.
        </p>

        {/* Invisible reCAPTCHA (used only for mobile OTP) */}
        <div id="recaptcha-container" />
      </div>
    </div>
  );
};
