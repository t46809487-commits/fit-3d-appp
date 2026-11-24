import React from 'react';

interface LockedScreenProps {
  onLogin: () => void;
}

// Shown to guests in every tab except Explore
export const LockedScreen: React.FC<LockedScreenProps> = ({ onLogin }) => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4 px-6 animate-fade-in">
    <div className="text-5xl">🔒</div>
    <h2 className="text-xl font-black text-white">Login zaroori hai</h2>
    <p className="text-sm text-neutral-400 max-w-xs">
      Guest sirf Explore dekh sakta hai. Workout, progress aur profile ke liye Google, Facebook ya mobile number se login karo.
    </p>
    <button
      onClick={onLogin}
      className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black transition active:scale-95"
    >
      Login / Sign up
    </button>
  </div>
);

interface LoginRequiredModalProps {
  open: boolean;
  onLogin: () => void;
  onClose: () => void;
}

// Pop-up shown when a guest taps something that starts or saves an exercise
export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ open, onLogin, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <h3 className="text-lg font-black text-white">Pehle login karo</h3>
        <p className="text-sm text-neutral-400">
          Exercise ya workout chalane ke liye Google, Facebook ya mobile number se login karna zaroori hai.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-bold transition"
          >
            Baad mein
          </button>
          <button
            onClick={onLogin}
            className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black transition"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};
