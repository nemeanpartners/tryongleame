import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Bookmark, 
  Heart, 
  Eye, 
  Share2, 
  Flame, 
  Check, 
  Sparkle,
  Palette,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import { PresetLook } from '../../types';

interface TryOnEditWeeklyCardProps {
  onTryOn: (preset: PresetLook) => void;
  onNavigate: (tab: 'gallery' | 'built-looks' | 'sandbox' | 'trending' | 'shade-edit') => void;
  username?: string;
}

interface WeeklyCapsuleLook {
  id: string;
  name: string;
  tag: string;
  headline: string;
  description: string;
  editorQuote: string;
  image: string;
  creator: string;
  likes: string;
  layers: {
    eyes: string;
    blush: string;
    lips: string;
    lashes: string;
  };
  swatches: { name: string; hex: string }[];
  preset: PresetLook;
}

const WEEKLY_CAPSULE_LOOKS: WeeklyCapsuleLook[] = [
  {
    id: 'edit_cherry_cola',
    name: 'Cherry Cola',
    tag: 'Look of the Week',
    headline: 'High-Shine Maroon Lacquer & Bronzed Warmth',
    description: 'The definitive fall beauty trend: high-impact candied cherry blush paired with black cherry syrup lip glaze and diffused copper shadow.',
    editorQuote: 'The secret to this viral look is layering a deep mahogany lip contour beneath a glass peptide gloss, keeping cheeks juicy and luminous.',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=800',
    creator: '@cherrycola.vibes',
    likes: '5.2K',
    layers: {
      eyes: 'Bronze Shimmer Wash (#7F1D1D)',
      blush: 'Candied Cherry Flush (#BE123C)',
      lips: 'Black Cherry Syrup (#581C87)',
      lashes: 'Wispy Flutter'
    },
    swatches: [
      { name: 'Bronze Spark', hex: '#7f1d1d' },
      { name: 'Candied Cherry', hex: '#be123c' },
      { name: 'Cola Glaze', hex: '#581c87' }
    ],
    preset: {
      id: 'look_cherry_cola',
      name: 'Cherry Cola',
      description: 'Deep maroon high-shine lip lacquer & warm bronze liner flick from The Weekly TryOn Edit.',
      eyeshadowColor: '#7f1d1d',
      eyeshadowOpacity: 0.65,
      eyelinerColor: '#450a0a',
      eyelinerOpacity: 0.85,
      eyelinerStyle: 'winged',
      blushColor: '#be123c',
      blushOpacity: 0.55,
      lipColor: '#581c87',
      lipOpacity: 0.95,
      lipGloss: true,
      lashesStyle: 'wispy',
      glitterLevel: 45,
      filter: 'warm-glow'
    }
  },
  {
    id: 'edit_espresso_makeup',
    name: 'Espresso Makeup',
    tag: 'Monochrome Luxe',
    headline: 'Roasted Cocoa Shadows & Velvet Mocha Pout',
    description: 'A rich monochromatic coffee palette featuring roasted espresso eye depth, sculpted warm terracotta cheekbones, and satin mocha lips.',
    editorQuote: 'A masterclass in modern neutral depth that sculpts features without looking heavy under daylight.',
    image: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=800',
    creator: '@espresso.latte',
    likes: '4.4K',
    layers: {
      eyes: 'Dark Roast Mocha (#451A03)',
      blush: 'Terracotta Sculpt (#9A3412)',
      lips: 'Velvet Mocha Satin (#78350F)',
      lashes: 'Full Glam'
    },
    swatches: [
      { name: 'Dark Roast', hex: '#451a03' },
      { name: 'Warm Terracotta', hex: '#9a3412' },
      { name: 'Mocha Satin', hex: '#78350f' }
    ],
    preset: {
      id: 'look_espresso_makeup',
      name: 'Espresso Makeup',
      description: 'Rich monochromatic roasted mocha eyes, cocoa cheeks & satin pout from The Weekly TryOn Edit.',
      eyeshadowColor: '#451a03',
      eyeshadowOpacity: 0.8,
      eyelinerColor: '#291003',
      eyelinerOpacity: 0.95,
      eyelinerStyle: 'cat-eye',
      blushColor: '#9a3412',
      blushOpacity: 0.45,
      lipColor: '#78350f',
      lipOpacity: 0.9,
      lipGloss: false,
      lashesStyle: 'glam',
      glitterLevel: 25,
      filter: 'warm-glow'
    }
  },
  {
    id: 'edit_clean_girl',
    name: 'Clean Girl',
    tag: 'Effortless Dew',
    headline: 'Glazed Skin, Feathered Brows & Sheer Rose Balm',
    description: 'The timeless minimalist uniform. Micro-highlighted high points, subtle peach cheek tint, and high-shine peptide lip hydration.',
    editorQuote: 'Lightweight perfection designed for daily confidence and radiant glass-skin reflectivity.',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800',
    creator: '@glowwithclaire',
    likes: '4.8K',
    layers: {
      eyes: 'Peach Glow Veil (#FDF2E9)',
      blush: 'Petal Cream Balm (#FBB6CE)',
      lips: 'Rose Dewy Oil (#F472B6)',
      lashes: 'Natural Feathered'
    },
    swatches: [
      { name: 'Peach Veil', hex: '#fdf2e9' },
      { name: 'Petal Cream', hex: '#fbb6ce' },
      { name: 'Rose Dew', hex: '#f472b6' }
    ],
    preset: {
      id: 'look_clean_girl',
      name: 'Clean Girl',
      description: 'Feathered brows, glazed skin, soft rose flush & sheer lip glow from The Weekly TryOn Edit.',
      eyeshadowColor: '#fdf2e9',
      eyeshadowOpacity: 0.3,
      blushColor: '#fbb6ce',
      blushOpacity: 0.35,
      lipColor: '#f472b6',
      lipOpacity: 0.7,
      lipGloss: true,
      lashesStyle: 'natural',
      glitterLevel: 15,
      filter: 'none'
    }
  },
  {
    id: 'edit_soft_grunge',
    name: 'Soft Grunge',
    tag: 'Edgy Romance',
    headline: 'Diffused Taupe-Charcoal Smoke & Muted Berry Velvet',
    description: 'A moody 90s rock romance aesthetic with lived-in charcoal shadow edges, sharp feline wing, and velvet plum stain.',
    editorQuote: 'Sultry, rebellious, yet refined. Perfect for evening concerts, gallery openings, and late dinner reservations.',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800',
    creator: '@grunge.muse',
    likes: '3.6K',
    layers: {
      eyes: 'Ash Charcoal Smoke (#3F3F46)',
      blush: 'Muted Mauve Flush (#B5838D)',
      lips: 'Velvet Berry Stain (#8C3A4F)',
      lashes: 'Dramatic Glam'
    },
    swatches: [
      { name: 'Ash Charcoal', hex: '#3f3f46' },
      { name: 'Muted Mauve', hex: '#b5838d' },
      { name: 'Berry Stain', hex: '#8c3a4f' }
    ],
    preset: {
      id: 'look_soft_grunge',
      name: 'Soft Grunge',
      description: 'Diffused taupe-charcoal smoky lids & muted velvet berry lips from The Weekly TryOn Edit.',
      eyeshadowColor: '#3f3f46',
      eyeshadowOpacity: 0.75,
      eyelinerColor: '#18181b',
      eyelinerOpacity: 0.9,
      eyelinerStyle: 'cat-eye',
      blushColor: '#b5838d',
      blushOpacity: 0.4,
      lipColor: '#8c3a4f',
      lipOpacity: 0.9,
      lipGloss: false,
      lashesStyle: 'glam',
      glitterLevel: 20,
      filter: 'vintage'
    }
  }
];

export const TryOnEditWeeklyCard: React.FC<TryOnEditWeeklyCardProps> = ({
  onTryOn,
  onNavigate,
  username
}) => {
  const [selectedLookIndex, setSelectedLookIndex] = useState<number>(0);
  const [savedCapsule, setSavedCapsule] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tryon_weekly_capsule_saved') === 'true';
    } catch {
      return false;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeLook = WEEKLY_CAPSULE_LOOKS[selectedLookIndex];

  const handleSaveCapsule = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !savedCapsule;
    setSavedCapsule(nextState);
    localStorage.setItem('tryon_weekly_capsule_saved', String(nextState));
    setToastMessage(nextState ? 'Weekly Capsule saved to your beauty library!' : 'Removed from saved capsules');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTryOnSpotlight = () => {
    onTryOn(activeLook.preset);
  };

  return (
    <section id="tryon-edit-weekly-card" className="relative space-y-4 text-left animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold shadow-xl border border-stone-700 flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-[#E91E63]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION HEADER: THE TRYON EDIT • WEEKLY */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.14em] font-sans">
            The TryOn Edit : Weekly
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-[#2A1715] text-[#FAF6F4] text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
            Issue #28
          </span>
        </div>
      </div>

      {/* MAIN LUXURY EDITORIAL CONTAINER */}
      <div 
        className="relative overflow-hidden rounded-[28px] border border-[#EDE7E3] bg-[#FAF6F4] transition-all duration-300"
        style={{
          boxShadow: '0 0 35px 8px rgba(72, 57, 49, 0.12), 0 16px 36px rgba(72, 57, 49, 0.12), 0 -16px 36px rgba(72, 57, 49, 0.12), 0 0 24px rgba(72, 57, 49, 0.10)'
        }}
      >
        
        {/* HERO EDITORIAL FEATURE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* LEFT 6 COLS: EXPANDED EDITORIAL PORTRAIT & QUICK TRY ON */}
          <div className="md:col-span-6 relative h-80 sm:h-[420px] md:h-full min-h-[340px] overflow-hidden bg-stone-900 group">
            <img 
              src={activeLook.image} 
              alt={activeLook.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Soft dark vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#E91E63] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                {activeLook.tag}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                {activeLook.creator}
              </span>
            </div>

            {/* Top Right Likes & Bookmark */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 flex items-center gap-1">
                <Heart className="w-3 h-3 text-[#E91E63] fill-current" />
                <span>{activeLook.likes}</span>
              </div>
              <button
                type="button"
                onClick={handleSaveCapsule}
                className={`p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                  savedCapsule
                    ? 'bg-[#E91E63] text-white border-[#E91E63]'
                    : 'bg-black/60 text-white hover:bg-black/80 border-white/20'
                }`}
                title={savedCapsule ? 'Saved to library' : 'Save Look'}
              >
                <Bookmark className={`w-3 h-3 ${savedCapsule ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Bottom Overlay Info & Fast CTA */}
            <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2">
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] font-extrabold text-[#F7C6D7] uppercase tracking-widest">
                  Featured Formula
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeLook.name}
                </h4>
              </div>

              <button
                type="button"
                onClick={handleTryOnSpotlight}
                className="w-full py-2.5 sm:py-3 bg-[#f7f3f0] hover:bg-[#ede7e3] text-[#171515] text-xs sm:text-[13px] font-black uppercase tracking-[0.16em] rounded-full shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer border border-white/50"
              >
                <span>TRY THIS LOOK</span>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#ff2f68] text-[#ff2f68] shrink-0">
                  <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* RIGHT 6 COLS: FORMULA BREAKDOWN, EDITOR MEMO & SWATCHES */}
          <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between space-y-6 text-left bg-[#f4efec]">
            
            {/* Header & Description */}
            <div className="space-y-2">
              <p className="m-0 mb-2 text-xs sm:text-sm font-extrabold tracking-[0.18em] text-[#8a7066] uppercase">
                Weekly Capsule Breakdown
              </p>
              <h3 className="m-0 text-2xl sm:text-[28px] lg:text-[31px] font-[780] text-[#171515] leading-[1.1] tracking-[-0.035em]">
                {activeLook.headline}
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[#5f5753] leading-[1.55]">
                {activeLook.description}
              </p>
            </div>

            {/* LAYER CONFIGURATION CARD */}
            <section 
              className="rounded-[28px] p-5 sm:p-5.5 bg-[#f7f3f0]"
              style={{
                boxShadow: '10px 12px 24px rgba(72,57,49,0.10), -8px -8px 20px rgba(255,255,255,0.55), inset 1px 1px 0 rgba(255,255,255,0.40)'
              }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[rgba(78,62,54,0.08)]">
                <svg className="w-7 h-7 shrink-0 stroke-[#ff2f68] fill-none stroke-[2] stroke-linejoin-round" viewBox="0 0 24 24">
                  <path d="M12 3 3 8l9 5 9-5-9-5Z"/>
                  <path d="m3 12 9 5 9-5"/>
                  <path d="m3 16 9 5 9-5"/>
                </svg>
                <div className="min-w-0 font-extrabold text-sm sm:text-base tracking-[0.14em] uppercase leading-tight text-[#171515] flex-1">
                  Layer<br />Configuration
                </div>
                <div className="shrink-0 px-3.5 py-2 rounded-full text-[#ff2f68] bg-[#fde8ee] text-xs sm:text-[13px] font-extrabold tracking-[0.09em] uppercase">
                  4 Verified Steps
                </div>
              </div>

              {/* 4-Layer Tiles Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5 mt-4">
                {/* Tile 1: Eyeshadow */}
                <article 
                  className="min-h-[130px] rounded-[24px] p-4 sm:p-4.5 bg-[#f0ebe7] flex flex-col justify-between text-left"
                  style={{
                    boxShadow: '6px 8px 16px rgba(74,58,50,0.08), -5px -5px 14px rgba(255,255,255,0.50), inset 1px 1px 0 rgba(255,255,255,0.35)'
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 mb-3 stroke-[#4b4643] fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                    <path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5S2.8 12 2.8 12Z"/>
                    <path d="M8.5 12c.8 1.2 2 1.8 3.5 1.8s2.7-.6 3.5-1.8"/>
                  </svg>
                  <div>
                    <p className="m-0 mb-1 text-[11px] sm:text-xs font-extrabold text-[#9d928c] tracking-[0.13em] uppercase">
                      Eyeshadow
                    </p>
                    <p className="m-0 text-sm sm:text-base font-[720] text-[#171515] leading-snug tracking-[-0.015em] break-words">
                      {activeLook.layers.eyes.split('(')[0].trim()}
                    </p>
                  </div>
                </article>

                {/* Tile 2: Cheek Blush */}
                <article 
                  className="min-h-[130px] rounded-[24px] p-4 sm:p-4.5 bg-[#f0ebe7] flex flex-col justify-between text-left"
                  style={{
                    boxShadow: '6px 8px 16px rgba(74,58,50,0.08), -5px -5px 14px rgba(255,255,255,0.50), inset 1px 1px 0 rgba(255,255,255,0.35)'
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 mb-3 stroke-[#4b4643] fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                    <circle cx="12" cy="12" r="6" strokeDasharray="2.4 3.2"/>
                  </svg>
                  <div>
                    <p className="m-0 mb-1 text-[11px] sm:text-xs font-extrabold text-[#9d928c] tracking-[0.13em] uppercase">
                      Cheek Blush
                    </p>
                    <p className="m-0 text-sm sm:text-base font-[720] text-[#171515] leading-snug tracking-[-0.015em] break-words">
                      {activeLook.layers.blush.split('(')[0].trim()}
                    </p>
                  </div>
                </article>

                {/* Tile 3: Lip Finish */}
                <article 
                  className="min-h-[130px] rounded-[24px] p-4 sm:p-4.5 bg-[#f0ebe7] flex flex-col justify-between text-left"
                  style={{
                    boxShadow: '6px 8px 16px rgba(74,58,50,0.08), -5px -5px 14px rgba(255,255,255,0.50), inset 1px 1px 0 rgba(255,255,255,0.35)'
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 mb-3 stroke-[#4b4643] fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                    <path d="M3.5 12c4.2-4.3 7.2-5.5 8.5-3 1.3-2.5 4.3-1.3 8.5 3-2.8 4.2-5.7 6-8.5 6s-5.7-1.8-8.5-6Z"/>
                    <path d="M5 12h14"/>
                  </svg>
                  <div>
                    <p className="m-0 mb-1 text-[11px] sm:text-xs font-extrabold text-[#9d928c] tracking-[0.13em] uppercase">
                      Lip Finish
                    </p>
                    <p className="m-0 text-sm sm:text-base font-[720] text-[#171515] leading-snug tracking-[-0.015em] break-words">
                      {activeLook.layers.lips.split('(')[0].trim()}
                    </p>
                  </div>
                </article>

                {/* Tile 4: Lashes Style */}
                <article 
                  className="min-h-[130px] rounded-[24px] p-4 sm:p-4.5 bg-[#f0ebe7] flex flex-col justify-between text-left"
                  style={{
                    boxShadow: '6px 8px 16px rgba(74,58,50,0.08), -5px -5px 14px rgba(255,255,255,0.50), inset 1px 1px 0 rgba(255,255,255,0.35)'
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 mb-3 stroke-[#4b4643] fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                    <path d="M3 9c2.4 4.5 5.4 6.8 9 6.8S18.6 13.5 21 9"/>
                    <path d="M6 11 4.5 15M10 13l-.6 4M14 13l.6 4M18 11l1.5 4"/>
                  </svg>
                  <div>
                    <p className="m-0 mb-1 text-[11px] sm:text-xs font-extrabold text-[#9d928c] tracking-[0.13em] uppercase">
                      Lashes Style
                    </p>
                    <p className="m-0 text-sm sm:text-base font-[720] text-[#171515] leading-snug tracking-[-0.015em] break-words">
                      {activeLook.layers.lashes}
                    </p>
                  </div>
                </article>
              </div>
            </section>

            {/* EDITOR'S STYLING NOTE */}
            <section 
              className="rounded-[28px] p-5 sm:p-5.5 bg-[#f0ebe7] text-left"
              style={{
                boxShadow: '8px 10px 20px rgba(72,57,49,0.09), -6px -6px 16px rgba(255,255,255,0.52), inset 1px 1px 0 rgba(255,255,255,0.38)'
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#786a63] fill-none stroke-[1.8]">
                  <path d="M6 3h9l3 3v15H6V3Z"/>
                  <path d="M15 3v4h4M9 11h6M9 15h6"/>
                </svg>
                <div className="text-xs sm:text-sm font-extrabold text-[#7e6960] tracking-[0.15em] uppercase">
                  Editor's Styling Note
                </div>
              </div>
              <blockquote className="m-0 text-sm sm:text-base leading-[1.55] text-[#504a46] italic">
                “{activeLook.editorQuote}”
              </blockquote>
            </section>

            {/* CAPSULE SWATCHES & ACTIONS */}
            <div className="space-y-4 pt-3 border-t border-[#4E3E36]/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#756b66] uppercase tracking-[0.14em]">
                  Capsule Swatches
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeLook.swatches.map((sw, sIdx) => (
                    <div 
                      key={sIdx}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7f3f0] border border-white/50 shadow-[3px_4px_10px_rgba(74,58,50,0.05),-3px_-3px_8px_rgba(255,255,255,0.50)] text-[11px] font-bold text-[#171515]"
                      title={sw.name}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full border border-white shadow-xs shrink-0" 
                        style={{ backgroundColor: sw.hex }}
                      />
                      <span>{sw.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleTryOnSpotlight}
                  className="flex-1 min-h-[52px] sm:min-h-[56px] rounded-full bg-[#f7f3f0] hover:bg-[#efe9e4] text-[#171515] text-xs sm:text-sm font-black uppercase tracking-[0.16em] flex items-center justify-center gap-2 px-6 transition-all duration-200 active:scale-[0.98] cursor-pointer border border-white/50"
                  style={{
                    boxShadow: '8px 10px 18px rgba(72,57,49,0.09), -6px -6px 16px rgba(255,255,255,0.55), inset 1px 1px 0 rgba(255,255,255,0.40)'
                  }}
                >
                  <span>TRY THIS LOOK</span>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#ff2f68] text-[#ff2f68] shrink-0">
                    <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('gallery')}
                  className="px-4 sm:px-5 min-h-[52px] sm:min-h-[56px] rounded-full bg-[#f7f3f0] hover:bg-[#ede7e3] border border-white/50 text-[#6f5d55] text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{
                    boxShadow: '6px 8px 16px rgba(74,58,50,0.07), -5px -5px 12px rgba(255,255,255,0.50), inset 1px 1px 0 rgba(255,255,255,0.38)'
                  }}
                >
                  <span>More</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#756b66]" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
