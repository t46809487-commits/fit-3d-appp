import React, { useState } from 'react';
import {
  loginWithGoogleSafe,
  loginWithFacebook,
  loginAsGuest,
  authErrorMessage,
} from '../../firebase';

export const LoginScreen: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      // onAuthStateChanged in App.tsx now takes the user into the app
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

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
            Guest sirf Explore dekh sakta hai. Workout chalane ke liye Google ya Facebook se login zaroori hai.
          </p>

          {error && (
            <div role="alert" className="rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <p className="text-[10px] text-neutral-600 text-center leading-relaxed">
          Login karke aap hamari Terms aur Privacy Policy se sehmat ho.
        </p>
      </div>
    </div>
  );
};
