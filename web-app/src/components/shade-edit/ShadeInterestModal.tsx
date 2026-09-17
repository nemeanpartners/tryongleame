import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Heart, 
  Check, 
  Flame, 
  ArrowRight,
  LogIn,
  Bell
} from 'lucide-react';
import { ShadeProduct, PresetLook } from '../../types';
import { auth } from '../../firebase';
import { onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { trackShadeTried, trackShopClick } from '../../lib/analytics';

interface ShadeInterestModalProps {
  product: ShadeProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onTryOn: (preset: PresetLook) => void;
}

export const ShadeInterestModal: React.FC<ShadeInterestModalProps> = ({
  product,
  isOpen,
  onClose,
  onTryOn
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [hasShownInterest, setHasShownInterest] = useState<boolean>(false);
  const [interestCount, setInterestCount] = useState<number>(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!product) return;
    try {
      const savedInterests = JSON.parse(localStorage.getItem('kobella_shade_interests') || '{}');
      const isInterested = !!savedInterests[product.id];
      setHasShownInterest(isInterested);
      setInterestCount(product.currentInterests + (isInterested ? 1 : 0));
    } catch {
      setHasShownInterest(false);
      setInterestCount(product.currentInterests);
    }
    setShowAuthPrompt(false);
  }, [product]);

  if (!isOpen || !product) return null;

  const handleToggleInterest = () => {
    // If not logged in, prompt user to log in
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      const savedInterests = JSON.parse(localStorage.getItem('kobella_shade_interests') || '{}');
      const newState = !hasShownInterest;
      
      if (newState) {
        savedInterests[product.id] = {
          timestamp: Date.now(),
          productName: product.name,
          category: product.category,
          userId: user.uid,
          userEmail: user.email
        };
        setInterestCount(prev => prev + 1);
        trackShopClick(product.id, product.name, product.categoryLabel, '$22.00', 'Waitlist Batch Interest');
      } else {
        delete savedInterests[product.id];
        setInterestCount(prev => Math.max(product.currentInterests, prev - 1));
      }
      
      localStorage.setItem('kobella_shade_interests', JSON.stringify(savedInterests));
      setHasShownInterest(newState);
      setShowAuthPrompt(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setUser(result.user);
        setShowAuthPrompt(false);
        // Automatically register interest
        const savedInterests = JSON.parse(localStorage.getItem('kobella_shade_interests') || '{}');
        savedInterests[product.id] = {
          timestamp: Date.now(),
          productName: product.name,
          category: product.category,
          userId: result.user.uid,
          userEmail: result.user.email
        };
        localStorage.setItem('kobella_shade_interests', JSON.stringify(savedInterests));
        setHasShownInterest(true);
        setInterestCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const percentProgress = Math.min(100, Math.round((interestCount / product.targetInterests) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Compact Modal Container (Zero scroll, fits screen) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#EDE7E3] z-10 my-auto text-left flex flex-col"
        >
          {/* Top Floating Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-md"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Photo of what it looks like */}
          <div className="relative h-52 sm:h-56 w-full shrink-0 overflow-hidden bg-stone-900">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Category Badge */}
            <div className="absolute top-3.5 left-3.5 z-10">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E91E63] text-white text-[9.5px] font-black uppercase tracking-wider shadow-md">
                {product.categoryLabel}
              </span>
            </div>

            {/* Product Title & Shade on Image */}
            <div className="absolute bottom-3 left-4 right-4 z-10 space-y-0.5">
              <div className="flex items-center gap-1.5">
                {product.colorHex && (
                  <span
                    className="w-3 h-3 rounded-full border border-white shadow-xs shrink-0"
                    style={{ backgroundColor: product.colorHex }}
                  />
                )}
                <span className="text-[10.5px] font-bold text-[#F7C6D7] uppercase tracking-wider">
                  {product.shadeName}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                {product.name}
              </h3>
              <p className="text-[11px] text-stone-300 font-medium">{product.finish}</p>
            </div>
          </div>

          {/* Body Section (Compact & Streamlined) */}
          <div className="p-4 sm:p-5 space-y-3.5 bg-white">
            
            {/* Community Demand Meter */}
            <div className="p-3 rounded-2xl bg-[#FFF6F7] border border-[#F7C6D7] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 text-black">
                  <Flame className="w-3.5 h-3.5 text-[#E91E63] animate-pulse" />
                  <span className="text-[11px] uppercase tracking-wider">Community Demand</span>
                </div>
                <span className="text-[#E91E63] font-black text-xs">{percentProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentProgress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#FF4081] to-[#E91E63] rounded-full"
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-stone-600 font-medium">
                <span>
                  <strong className="text-black font-bold">{interestCount}</strong> requested
                </span>
                <span>
                  Goal: <strong className="text-black font-bold">{product.targetInterests}</strong>
                </span>
              </div>
            </div>

            {/* Auth prompt if non-logged in user taps interest */}
            {showAuthPrompt && !user && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-xs space-y-2"
              >
                <p className="text-[11px] text-stone-600">
                  Please sign in to register your interest and get notified when this product drops:
                </p>
                <button
                  onClick={handleQuickGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full py-2 px-3 rounded-lg bg-black hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google to Get Notified'}</span>
                </button>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-0.5">
              {/* Get Notified / Interest Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleInterest}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  hasShownInterest
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                    : 'bg-[#E91E63] hover:bg-[#d81b60] text-white shadow-[#E91E63]/25'
                }`}
              >
                {hasShownInterest ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Notification Saved ({interestCount} On Waitlist)</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-white fill-white/30" />
                    <span>Get Notified – Product Coming Soon</span>
                  </>
                )}
              </motion.button>

              {/* Try On Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  trackShadeTried(product.name, product.categoryLabel, product.presetConfig?.eyeshadowColor || product.presetConfig?.lipColor || '#E91E63');
                  onClose();
                  onTryOn(product.presetConfig);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF4081]" />
                <span>Try On Shade in Camera</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </motion.button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
