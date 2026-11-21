import React, { useState } from 'react';
import { UserProfile, SubscriptionConfig, SubscriptionPlanId, SubscriptionTier } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../data/subscriptions';
import { Check, Crown, Shield, Sparkles, Zap, Lock, CreditCard, AlertCircle } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSelectPlan: (plan: SubscriptionConfig) => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSelectPlan,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('pro_monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTier: SubscriptionTier = userProfile.subscription?.tier || 'free';

  const displayedPlans = SUBSCRIPTION_PLANS.filter((p) => {
    if (billingCycle === 'monthly') {
      return p.id === 'pro_monthly' || p.id === 'elite_monthly' || p.id === 'free';
    }
    return p.id === 'pro_annual' || p.id === 'elite_annual' || p.id === 'free';
  });

  const handleCheckout = async () => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    setIsProcessing(true);
    try {
      await onSelectPlan(plan);
      setPaymentSuccessMsg(`Payment verified! ${plan.name} entitlement activated.`);
      setTimeout(() => {
        setPaymentSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Subscription error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5" /> FIT3D Membership
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Unlock Full 3D Biomechanics & Nutrition
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
            Choose your tier for personalized 3D avatar shaping, AI meal plans, and advanced workout periodization.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-4 inline-flex items-center p-1 rounded-2xl bg-neutral-800 border border-neutral-700 text-xs">
            <button
              onClick={() => {
                setBillingCycle('monthly');
                setSelectedPlanId('pro_monthly');
              }}
              className={`px-4 py-1.5 rounded-xl font-bold transition ${
                billingCycle === 'monthly'
                  ? 'bg-neutral-900 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => {
                setBillingCycle('annual');
                setSelectedPlanId('pro_annual');
              }}
              className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-neutral-900 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Annual Billing
              <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold">
                SAVE ~44%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayedPlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isCurrent = currentTier === plan.tier;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative p-4 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-800/90 border-orange-500 ring-2 ring-orange-500/50 shadow-xl'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-[9px] uppercase tracking-wider shadow">
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-neutral-300">
                        {plan.tier}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <span className="text-2xl font-black text-white font-mono">
                        ₹{plan.priceInr}
                      </span>
                      <span className="text-xs text-neutral-400 ml-1">
                        /{plan.billingPeriod === 'lifetime' ? 'forever' : plan.billingPeriod}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-neutral-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3">
                    <button
                      className={`w-full py-2 rounded-xl text-xs font-black transition ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                          : 'bg-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure Payment & Policy Notice */}
          <div className="p-4 rounded-2xl bg-neutral-800/40 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-neutral-200 block">Verified Secure Transaction & Transparent Billing</span>
              <span>
                Payments are processed through official secure gateway channels. Server-verified signature activates your entitlement instantly. Cancel anytime from your Profile settings without lock-ins.
              </span>
            </div>
          </div>

          {paymentSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              ✓ {paymentSuccessMsg}
            </div>
          )}
        </div>

        {/* Footer Checkout Button */}
        <div className="p-5 border-t border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div>
            <span className="text-xs text-neutral-500 block">Selected Plan</span>
            <span className="text-sm font-bold text-white">
              {SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId)?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
            >
              Maybe Later
            </button>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black text-xs font-black shadow-lg shadow-orange-500/25 flex items-center gap-2"
            >
              {isProcessing ? (
                <>Verifying Payment...</>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Proceed to Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
