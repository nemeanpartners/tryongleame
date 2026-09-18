import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ArrowRight, Sparkle, Heart, Palette } from 'lucide-react';
import { PresetLook } from '../../types';

export interface PostSaveDiscoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedLookName?: string;
  onTryOn: (preset: PresetLook) => void;
  onNavigateToMyLooks?: () => void;
}

// Similar looks presets as requested
export const ESPRESSO_GLAZE_PRESET: PresetLook = {
  id: 'espresso_glaze',
  name: 'Espresso Glaze',
  description: 'Roasted cocoa melt, terracotta contour & high-gloss mocha pout',
  eyeshadowColor: '#451a03',
  eyeshadowOpacity: 0.8,
  eyelinerColor: '#291003',
  eyelinerOpacity: 0.95,
  eyelinerStyle: 'cat-eye',
  blushColor: '#9a3412',
  blushOpacity: 0.45,
  lipColor: '#78350f',
  lipOpacity: 0.9,
  lipGloss: true,
  lashesStyle: 'glam',
  glitterLevel: 30,
  filter: 'warm-glow',
};

export const NINETIES_NUDE_PRESET: PresetLook = {
  id: '90s_nude',
  name: '90s Nude',
  description: 'Matte taupe cut-crease, structured liner & velvety caramel nude lip',
  eyeshadowColor: '#78716c',
  eyeshadowOpacity: 0.65,
  eyelinerColor: '#44403c',
  eyelinerOpacity: 0.85,
  eyelinerStyle: 'classic',
  blushColor: '#a8a29e',
  blushOpacity: 0.35,
  lipColor: '#854d0e',
  lipOpacity: 0.9,
  lipGloss: false,
  lashesStyle: 'wispy',
  glitterLevel: 10,
  filter: 'vintage',
};

export const SOFT_BRONZE_PRESET: PresetLook = {
  id: 'soft_bronze',
  name: 'Soft Bronze',
  description: 'Sunkissed golden lids, warm terracotta cheek & spiced honey gloss',
  eyeshadowColor: '#b45309',
  eyeshadowOpacity: 0.7,
  eyelinerColor: '#78350f',
  eyelinerOpacity: 0.75,
  eyelinerStyle: 'winged',
  blushColor: '#c2410c',
  blushOpacity: 0.5,
  lipColor: '#b45309',
  lipOpacity: 0.85,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 60,
  filter: 'warm-glow',
};

// Alternate Lip Swatches for "Try another lip →"
const ALTERNATE_LIPS = [
  {
    name: 'Cherry Syrup',
    colorHex: '#881337',
    gloss: true,
    preset: {
      id: 'cherry_syrup_lip',
      name: 'Cherry Syrup Lip',
      description: 'High-shine glazed cherry lacquer',
      eyeshadowColor: '#d97706',
      eyeshadowOpacity: 0.5,
      blushColor: '#be123c',
      blushOpacity: 0.5,
      lipColor: '#881337',
      lipOpacity: 0.95,
      lipGloss: true,
      lashesStyle: 'wispy' as const,
      glitterLevel: 30,
      filter: 'warm-glow' as const,
    }
  },
  {
    name: 'Glazed Caramel',
    colorHex: '#9a3412',
    gloss: true,
    preset: {
      id: 'glazed_caramel_lip',
      name: 'Glazed Caramel Lip',
      description: 'Rich warm honey glaze & mocha liner',
      eyeshadowColor: '#d97706',
      eyeshadowOpacity: 0.5,
      blushColor: '#ea580c',
      blushOpacity: 0.45,
      lipColor: '#9a3412',
      lipOpacity: 0.9,
      lipGloss: true,
      lashesStyle: 'natural' as const,
      glitterLevel: 25,
      filter: 'warm-glow' as const,
    }
  },
  {
    name: 'Rose Quartz',
    colorHex: '#db2777',
    gloss: true,
    preset: {
      id: 'rose_quartz_lip',
      name: 'Rose Quartz Lip',
      description: 'Frosty dewy rose petal gloss',
      eyeshadowColor: '#f472b6',
      eyeshadowOpacity: 0.5,
      blushColor: '#f43f5e',
      blushOpacity: 0.5,
      lipColor: '#db2777',
      lipOpacity: 0.85,
      lipGloss: true,
      lashesStyle: 'wispy' as const,
      glitterLevel: 50,
      filter: 'holographic' as const,
    }
  },
  {
    name: 'Velvet Berry',
    colorHex: '#581c87',
    gloss: false,
    preset: {
      id: 'velvet_berry_lip',
      name: 'Velvet Berry Lip',
      description: 'Matte saturated blackberry velvet',
      eyeshadowColor: '#7c3aed',
      eyeshadowOpacity: 0.4,
      blushColor: '#9333ea',
      blushOpacity: 0.4,
      lipColor: '#581c87',
      lipOpacity: 0.95,
      lipGloss: false,
      lashesStyle: 'glam' as const,
      glitterLevel: 15,
      filter: 'vintage' as const,
    }
  }
];

const SIMILAR_LOOKS = [
  {
    id: 'espresso_glaze',
    preset: ESPRESSO_GLAZE_PRESET,
    title: 'Espresso Glaze',
    tagline: 'Cocoa melt & glossy mocha pout',
    image: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
    swatches: ['#451a03', '#9a3412', '#78350f']
  },
  {
    id: '90s_nude',
    preset: NINETIES_NUDE_PRESET,
    title: '90s Nude',
    tagline: 'Matte taupe lids & caramel nude',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    swatches: ['#78716c', '#a8a29e', '#854d0e']
  },
  {
    id: 'soft_bronze',
    preset: SOFT_BRONZE_PRESET,
    title: 'Soft Bronze',
    tagline: 'Sunkissed golden glow & terracotta',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
    swatches: ['#b45309', '#c2410c', '#b45309']
  }
];

export const PostSaveDiscoverModal: React.FC<PostSaveDiscoverModalProps> = ({
  isOpen,
  onClose,
  savedLookName = 'Golden Hour Velvet',
  onTryOn,
  onNavigateToMyLooks
}) => {
  const [activeLipIndex, setActiveLipIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentAltLip = ALTERNATE_LIPS[activeLipIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1F100E]/75 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md glass-sheet rounded-3xl overflow-hidden z-10 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Banner Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#E91E63] via-[#F472B6] to-[#FBBF24]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto scrollbar-thin">
            
            {/* ========================================================================= */}
            {/* 1. SAVED CONFIRMATION (MATCHING EXACT REQUESTED PHRASING)                */}
            {/* ========================================================================= */}
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#FBCFE8] text-[#BE123C] text-xs font-black tracking-wide">
                <Sparkle className="w-3 h-3 fill-[#E91E63] text-[#E91E63]" />
                <span>Saved ✨</span>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight font-sans">
                Your look is now in My Looks
              </h3>
              
              {savedLookName && (
                <p className="text-xs text-stone-500 font-medium">
                  <span className="font-bold text-stone-700">{savedLookName}</span> has been stored to your personal collection.
                </p>
              )}

              {onNavigateToMyLooks && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToMyLooks();
                  }}
                  className="text-xs font-bold text-[#E91E63] hover:text-[#c2185b] inline-flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                >
                  <span>View in My Looks</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 2. THEN IMMEDIATELY: TRY ANOTHER LIP →                                    */}
            {/* ========================================================================= */}
            <div className="rounded-2xl bg-[#FAF6F4] border border-[#EDE7E3] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTryOn(currentAltLip.preset);
                  }}
                  className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-black hover:text-[#E91E63] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>Try another lip</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E91E63] group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Quick Switch
                </span>
              </div>

              {/* Lip Shades Selector Bar */}
              <div className="grid grid-cols-4 gap-2">
                {ALTERNATE_LIPS.map((lip, idx) => {
                  const isSelected = idx === activeLipIndex;
                  return (
                    <button
                      key={lip.name}
                      type="button"
                      onClick={() => setActiveLipIndex(idx)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer text-center ${
                        isSelected 
                          ? 'bg-white border-[#E91E63] shadow-xs scale-102' 
                          : 'bg-[#F4ECE9]/60 border-transparent hover:bg-white hover:border-[#EDE7E3]'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 rounded-full border border-white shadow-xs" 
                        style={{ backgroundColor: lip.colorHex }}
                      />
                      <span className="text-[10px] font-bold text-stone-800 leading-tight truncate w-full">
                        {lip.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Try Lip Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTryOn(currentAltLip.preset);
                }}
                className="w-full py-2.5 px-4 rounded-full bg-[#2A1715] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer"
              >
                <span>Try {currentAltLip.name}</span>
                <span className="text-[#F472B6]">✦</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* 3. OR DIVIDER                                                            */}
            {/* ========================================================================= */}
            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EDE7E3]" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                or
              </span>
            </div>

            {/* ========================================================================= */}
            {/* 4. SIMILAR LOOKS YOU MIGHT LIKE (ESPRESSO GLAZE, 90S NUDE, SOFT BRONZE)   */}
            {/* ========================================================================= */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-[13px] font-bold text-black uppercase tracking-wider font-sans">
                  Similar looks you might like
                </h4>
                <span className="text-[10px] font-bold text-[#E91E63] uppercase tracking-wider">
                  SAVE → DISCOVER
                </span>
              </div>

              <div className="space-y-2">
                {SIMILAR_LOOKS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      onTryOn(item.preset);
                    }}
                    className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl border border-[#EDE7E3] hover:border-[#B8887A] bg-[#FAF6F4] hover:bg-white transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-white shadow-2xs">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h5 className="text-xs sm:text-[13px] font-extrabold text-black group-hover:text-[#E91E63] transition-colors leading-tight truncate">
                          {item.title}
                        </h5>
                        <p className="text-[10.5px] text-stone-500 font-medium truncate">
                          {item.tagline}
                        </p>
                        <div className="flex items-center gap-1 pt-0.5">
                          {item.swatches.map((hex, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs inline-block"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onTryOn(item.preset);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-white group-hover:bg-[#EBC9D6] text-black group-hover:text-[#2A1715] border border-[#EDE7E3] group-hover:border-[#EBC9D6] text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>TRY</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
