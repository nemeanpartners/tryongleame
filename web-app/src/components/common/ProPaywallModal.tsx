import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, Check, X, ShieldCheck, Lock, Star, Zap, Flame } from 'lucide-react';

export interface ProPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess?: () => void;
  onUnlocked?: () => void;
  triggerLook?: {
    name: string;
    image?: string;
    tagline?: string;
    categoryLabel?: string;
  } | null;
  lookTitle?: string;
  lookImage?: string;
  featureName?: string;
  lookTagline?: string;
  categoryLabel?: string;
}

export const ProPaywallModal: React.FC<ProPaywallModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  onUnlocked,
  triggerLook,
  lookTitle,
  lookImage,
  featureName,
  lookTagline,
  categoryLabel
}) => {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [isActivating, setIsActivating] = useState(false);

  const effectiveLook = triggerLook || (lookTitle || featureName ? {
    name: lookTitle || featureName || 'VIP Exclusive Look',
    image: lookImage,
    tagline: lookTagline,
    categoryLabel: categoryLabel
  } : null);

  const handleUnlock = () => {
    setIsActivating(true);
    setTimeout(() => {
      try {
        localStorage.setItem('gleame_pro_subscriber', 'true');
        localStorage.setItem('gleame_pro_activated_at', Date.now().toString());
      } catch (e) {
        console.error(e);
      }
      setIsActivating(false);
      if (onUnlockSuccess) onUnlockSuccess();
      if (onUnlocked) onUnlocked();
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-lg bg-[#191516] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl z-10 text-white my-auto max-h-[92vh] flex flex-col"
          >
            {/* Top Glowing Ambient Accent */}
            <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-amber-500/20 via-rose-500/10 to-transparent pointer-events-none" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 pt-7 pb-6 space-y-5">
              
              {/* Header Badge */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-inner">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>TryOn VIP Pro Access</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                  Unlock Exclusive Runway Looks
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 max-w-sm">
                  Experience full access to locked VIP formulas, hyper-realistic 4K AR mirror, and custom shade mixing.
                </p>
              </div>

              {/* Triggered Look Card Highlight */}
              {effectiveLook && (
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.06] border border-amber-400/20 backdrop-blur-sm">
                  {effectiveLook.image && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <img 
                        src={effectiveLook.image} 
                        alt={effectiveLook.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-amber-300" />
                      </div>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Locked Pro Formula</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{effectiveLook.name}</p>
                    <p className="text-xs text-stone-400 truncate">{effectiveLook.tagline || effectiveLook.categoryLabel || 'Exclusive Pro Preset'}</p>
                  </div>
                </div>
              )}

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-1">
                {[
                  { title: 'Unlock All 5+ Exclusive Locked Formulas', desc: 'Parisian Velvet Noir, Cyber Duochrome, Hollywood Siren, & more' },
                  { title: '4K Ultra-HD AR Camera & Studio Lighting', desc: 'Real-time hyper-responsive eye, lip, blush, and lash simulation' },
                  { title: 'Custom Shade & Undertone Precision Mixer', desc: 'Dial in opacity, pigment intensity, and multi-layer duochrome glazes' },
                  { title: 'Unlimited High-Resolution Look Exports', desc: 'Export photos & video transformation reels without watermarks' },
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-left">
                    <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-amber-300 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-100">{feat.title}</p>
                      <p className="text-[11px] text-stone-400">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Plan Options Selector */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Annual */}
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`relative p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    billingCycle === 'annual'
                      ? 'bg-gradient-to-b from-amber-500/20 to-rose-500/10 border-amber-400 ring-1 ring-amber-400/50 shadow-lg'
                      : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-black text-[9px] font-black uppercase tracking-wider">
                    Save 45%
                  </div>
                  <p className="text-xs font-bold text-stone-300">Annual Plan</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-white">$3.33</span>
                    <span className="text-[10px] text-stone-400">/mo</span>
                  </div>
                  <p className="text-[10px] text-amber-300/90 mt-1 font-medium">$39.99 billed yearly</p>
                </button>

                {/* Monthly */}
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`relative p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-b from-amber-500/20 to-rose-500/10 border-amber-400 ring-1 ring-amber-400/50 shadow-lg'
                      : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-bold text-stone-300">Monthly Plan</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-white">$5.99</span>
                    <span className="text-[10px] text-stone-400">/mo</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1 font-medium">Billed monthly, cancel anytime</p>
                </button>
              </div>

              {/* Unlock Action Button */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={isActivating}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 text-black font-extrabold text-sm tracking-wide shadow-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isActivating ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-black" />
                      <span>Start 7-Day Free Trial & Unlock</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-stone-400">
                  7 days free, then {billingCycle === 'annual' ? '$39.99/year' : '$5.99/month'}. Cancel anytime in settings.
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
