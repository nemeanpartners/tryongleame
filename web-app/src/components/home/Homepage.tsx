import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Crown, 
  GalleryHorizontal, 
  Heart, 
  MessageSquare, 
  Sparkles, 
  Trophy, 
  Eye, 
  Video, 
  ExternalLink 
} from 'lucide-react';
import { PresetLook } from '../../types';

interface HomepageProps {
  onNavigate: (tab: 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'tiktok-effects') => void;
  onLoadPreset?: (preset: PresetLook) => void;
}

const exploreCards = [
  {
    tab: 'gallery' as const,
    title: 'Challenge Gallery',
    eyebrow: 'LIVE ENTRIES',
    copy: 'Browse submitted looks, save favorites, and open community formulas.',
    icon: GalleryHorizontal,
  },
  {
    tab: 'votes' as const,
    title: 'Vote Board',
    eyebrow: 'DECIDE WHAT SHIPS',
    copy: 'Upvote active looks and help choose the next Gleame challenge winner.',
    icon: Heart,
  },
  {
    tab: 'trending' as const,
    title: 'Requests & Trends',
    eyebrow: 'COMMUNITY DEMAND',
    copy: 'See requested makeup styles and submit ideas for new presets.',
    icon: MessageSquare,
  },
  {
    tab: 'hall-of-fame' as const,
    title: 'Legends Archives',
    eyebrow: 'WINNING ALBUM',
    copy: 'Review crowned looks and use them as inspiration for the next build.',
    icon: Trophy,
  },
];

// Presets mapped to the exact sandbox try-on configuration
const MIX_MATCH_PRESET: PresetLook = {
  id: 'sunset_silk',
  name: 'Golden Hour Silk',
  description: 'Our top-rated customized community blend. A warm, romantic sunset glow featuring rich coppery eyeshadow, vibrant rose cheeks, and a deep velvet plum lip glaze, set against our signature Golden Hour filter.',
  eyeshadowColor: '#d97706',
  eyeshadowOpacity: 0.75,
  blushColor: '#bc8381',
  blushOpacity: 0.55,
  lipColor: '#f43f5e',
  lipOpacity: 0.8,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 75,
  filter: 'warm-glow',
};

const TIKTOK_PRESET: PresetLook = {
  id: 'bold-siren',
  name: 'Siren Velvet Red',
  description: 'Chic Parisian beauty effect highlighting a striking, ultra-defined matte ruby lip paired with a clean, sharp fox-eye wing.',
  eyeshadowColor: '#1a1a1a',
  eyeshadowOpacity: 0.3,
  eyelinerColor: '#be123c',
  eyelinerOpacity: 0.9,
  eyelinerStyle: 'cat-eye',
  blushColor: '#e11d48',
  blushOpacity: 0.4,
  lipColor: '#be123c',
  lipOpacity: 0.95,
  lipGloss: false,
  lashesStyle: 'glam',
  glitterLevel: 10,
  filter: 'none',
};

const LATEST_PRESET: PresetLook = {
  id: 'holo_heatwave',
  name: 'Holographic Heatwave',
  description: 'An ethereal cybernetic formula shifting between iridescent pink shimmer and deep cosmic violet sheen, crowned with high-volume dramatic lashes.',
  eyeshadowColor: '#d946ef',
  eyeshadowOpacity: 0.8,
  eyelinerColor: '#ff3f87',
  eyelinerOpacity: 0.9,
  eyelinerStyle: 'cat-eye',
  blushColor: '#f43f5e',
  blushOpacity: 0.4,
  lipColor: '#db2777',
  lipOpacity: 0.85,
  lipGloss: true,
  lashesStyle: 'glam',
  glitterLevel: 90,
  filter: 'holographic',
};

export const Homepage: React.FC<HomepageProps> = ({ onNavigate, onLoadPreset }) => {

  const handleTryOn = (preset: PresetLook) => {
    if (onLoadPreset) {
      onLoadPreset(preset);
    } else {
      onNavigate('built-looks');
    }
  };

  return (
    <div id="homepage-container" className="space-y-12 animate-in fade-in duration-300 text-stone-800 pb-16">
      
      {/* 1. HERO HEADER BANNER */}
      <section className="relative overflow-hidden rounded-[24px] border border-white/70 bg-gradient-to-tr from-stone-50/80 via-white/70 to-stone-100/50 p-6 sm:p-8 shadow-[0_16px_40px_rgba(20,20,20,0.05)] backdrop-blur-2xl text-left">
        <div className="absolute inset-x-8 -top-20 h-44 bg-[#732729]/5 blur-3xl pointer-events-none" />
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-[#bc8381]/20 bg-[#bc8381]/5 blur-sm pointer-events-none" />

        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-4">
            <span className="bg-[#bc8381]/15 text-[#732729] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              ★ Studio Discovery Portal
            </span>
            <div className="space-y-2">
              <h1 className="max-w-xl text-3xl md:text-4xl font-serif font-black tracking-tight text-stone-950 uppercase leading-none">
                Gleame <span className="font-sans font-light text-stone-600 block text-lg tracking-widest mt-1">THE LUXURY BEAUTY ENGINE</span>
              </h1>
              <p className="max-w-md text-xs font-semibold leading-relaxed text-stone-500">
                Explore custom real-time shaders, vote on active community formulas, or design signature cosmetic profiles inside our sandboxed editor.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() => onNavigate('built-looks')}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(20,20,20,0.15)] transition-all hover:bg-[#732729] cursor-pointer"
              >
                Try On Makeup Looks <ArrowRight className="h-3.5 w-3.5 text-white animate-pulse" />
              </button>
              <button
                onClick={() => onNavigate('tiktok-effects')}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-stone-800 transition-all hover:bg-stone-50 cursor-pointer shadow-xs"
              >
                <Video className="w-3.5 h-3.5 text-stone-500" /> TikTok Effects
              </button>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#bc8381]/25 bg-[#732729] p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[8px] font-black uppercase tracking-widest text-[#bc8381]">Active Community Challenge</div>
                <h2 className="mt-0.5 text-lg font-serif font-bold italic tracking-wide">Holographic Heatwave</h2>
              </div>
              <Crown className="h-5 w-5 text-[#bc8381]" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-left">
              {[
                ['Entries', '24 Submitters'],
                ['Voting', 'Active Now'],
                ['Prize', 'TikTok Release'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <div className="text-[8px] font-bold uppercase text-stone-300">{label}</div>
                  <div className="mt-0.5 text-xs font-black text-[#f5eae7]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. OPTION CARDS SECTION */}
      <section className="space-y-4">
        <div className="text-left">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#bc8381]">Interactive Hub</span>
          <h2 className="text-lg font-serif font-black text-stone-900 uppercase tracking-widest">Studio Portals</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exploreCards.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                onClick={() => onNavigate(item.tab)}
                className="group rounded-2xl border border-[#bc8381]/15 bg-white/65 p-5 text-left shadow-xs backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#732729]/30 hover:bg-white hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl border border-[#bc8381]/25 bg-[#faf6f5] p-2.5 text-stone-700 transition-colors group-hover:text-[#732729] group-hover:bg-[#bc8381]/10">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-300 transition-colors group-hover:text-[#732729] group-hover:translate-x-0.5" />
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-[#bc8381]">{item.eyebrow}</div>
                    <h3 className="mt-1 text-sm font-serif font-black text-stone-950 group-hover:text-[#732729] transition-colors">{item.title}</h3>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-stone-500">{item.copy}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. SHOW BANNERS: SLEEK LUXURIOUS EDITORIAL SHOWCARDS */}
      <section className="space-y-8 pt-4">
        <div className="text-left border-b border-stone-200/60 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#bc8381]">Curation Series</span>
            <h2 className="text-lg font-serif font-black text-stone-900 uppercase tracking-widest">Platform Spotlights</h2>
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#732729] bg-[#bc8381]/15 px-3 py-1 rounded-full">
            ★ Handcrafted Formulas
          </span>
        </div>

        {/* BANNER 1: BEST LOOK FROM MIX & MATCH */}
        <div className="group rounded-[24px] border border-[#bc8381]/20 bg-white shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden text-left grid grid-cols-1 lg:grid-cols-12">
          {/* Cover image (Landscape-editorial style) */}
          <div className="lg:col-span-6 relative h-64 lg:h-auto min-h-[250px] overflow-hidden bg-stone-100">
            <img 
              src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=800" 
              alt="Mix & Match Winner" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-stone-950/20" />
            
            {/* Visual Specs Badge Overlay */}
            <div className="absolute top-4 left-4 bg-[#732729]/90 backdrop-blur-md text-[#FAF6F5] border border-[#bc8381]/30 px-3.5 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase">
              🏆 Mix & Match Spotlight
            </div>
          </div>

          {/* Details & Specifications */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#bc8381] block">Top Rated Community Blend</span>
              <h3 className="text-2xl font-serif font-black text-[#732729] leading-tight">
                {MIX_MATCH_PRESET.name}
              </h3>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                {MIX_MATCH_PRESET.description}
              </p>

              {/* Cosmetic Blueprint Specs */}
              <div className="bg-[#faf6f5] p-3.5 rounded-xl border border-[#bc8381]/15 space-y-2.5">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block border-b border-[#bc8381]/10 pb-1">Cosmetic Shader Breakdown</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[8px] font-extrabold text-stone-400 block uppercase">Eyeshadow</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div style={{ backgroundColor: MIX_MATCH_PRESET.eyeshadowColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                      <span className="text-[10px] font-bold text-stone-700">75% Copper</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] font-extrabold text-stone-400 block uppercase">Cheeks</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div style={{ backgroundColor: MIX_MATCH_PRESET.blushColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                      <span className="text-[10px] font-bold text-stone-700">55% Rose</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] font-extrabold text-stone-400 block uppercase">Lips</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div style={{ backgroundColor: MIX_MATCH_PRESET.lipColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                      <span className="text-[10px] font-bold text-stone-700">80% Ruby</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Lashes: {MIX_MATCH_PRESET.lashesStyle}</span>
              <button 
                onClick={() => handleTryOn(MIX_MATCH_PRESET)}
                className="bg-[#732729] hover:bg-[#5c1d1f] text-white font-extrabold text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl cursor-pointer shadow-sm hover:scale-[1.01] transition-all flex items-center gap-1.5"
              >
                Try on Sandbox <Sparkles className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* BANNER 2: TRENDING TIKTOK EFFECT */}
        <div className="group rounded-[24px] border border-[#bc8381]/20 bg-white shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden text-left grid grid-cols-1 lg:grid-cols-12">
          {/* Details & Specifications */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6 lg:order-1 order-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#bc8381] block">VIRAL AR FILTER SHADER</span>
                <span className="bg-[#ff3f87] text-white text-[8px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <Video className="w-2.5 h-2.5 fill-current" /> TikTok
                </span>
              </div>
              <h3 className="text-2xl font-serif font-black text-stone-900 leading-tight">
                {TIKTOK_PRESET.name}
              </h3>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                {TIKTOK_PRESET.description}
              </p>

              {/* Engagement metrics */}
              <div className="grid grid-cols-2 gap-4 py-1.5">
                <div className="bg-stone-50 border border-stone-200/40 p-3 rounded-xl">
                  <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 block">TikTok views</span>
                  <span className="text-sm font-serif font-black text-stone-800">4.5M Views</span>
                </div>
                <div className="bg-stone-50 border border-stone-200/40 p-3 rounded-xl">
                  <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 block">TikTok Likes</span>
                  <span className="text-sm font-serif font-black text-[#732729]">380K Likes</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-stone-100">
              <a 
                href="https://vt.tiktok.com/ZS9hKkunc5KF2-oXcAD/"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-stone-900 hover:bg-stone-950 text-white font-extrabold text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                Launch on TikTok <ExternalLink className="w-3 h-3 text-white" />
              </a>
              <button 
                onClick={() => handleTryOn(TIKTOK_PRESET)}
                className="flex-1 border border-[#bc8381]/35 hover:bg-[#bc8381]/5 text-[#732729] font-extrabold text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl cursor-pointer text-center"
              >
                Simulate in Studio
              </button>
            </div>
          </div>

          {/* Cover image (Landscape-editorial style) */}
          <div className="lg:col-span-6 relative h-64 lg:h-auto min-h-[250px] overflow-hidden bg-stone-100 lg:order-2 order-1">
            <img 
              src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=800" 
              alt="TikTok effect model" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/10 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:to-stone-950/20" />
            
            {/* Overlay */}
            <div className="absolute top-4 right-4 bg-stone-950/90 backdrop-blur-md text-[#d7b56d] border border-stone-800 px-3.5 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase">
              ★ Active AR Effect
            </div>
          </div>
        </div>

        {/* BANNER 3: LATEST MAKEUP LOOK PREVIEW */}
        <div className="group rounded-[24px] border border-[#bc8381]/20 bg-white shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden text-left grid grid-cols-1 lg:grid-cols-12">
          {/* Cover image (Landscape-editorial style) */}
          <div className="lg:col-span-6 relative h-64 lg:h-auto min-h-[250px] overflow-hidden bg-stone-100">
            <img 
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800" 
              alt="Latest Preset Preview" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-stone-950/20" />
            
            {/* Visual Specs Badge Overlay */}
            <div className="absolute top-4 left-4 bg-stone-900/90 backdrop-blur-md text-[#bc8381] border border-stone-800 px-3.5 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase">
              ✨ New Studio Arrival
            </div>
          </div>

          {/* Details & Specifications */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#bc8381] block font-mono">Packaged Formula Release</span>
              <h3 className="text-2xl font-serif font-black text-stone-900 leading-tight">
                {LATEST_PRESET.name}
              </h3>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                {LATEST_PRESET.description}
              </p>

              {/* Swatch chips */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Recipe Swatches</span>
                <div className="flex gap-1.5">
                  <div style={{ backgroundColor: LATEST_PRESET.eyeshadowColor }} className="w-5 h-5 rounded-full border border-stone-200" title="Eyeshadow color" />
                  <div style={{ backgroundColor: LATEST_PRESET.blushColor }} className="w-5 h-5 rounded-full border border-stone-200" title="Blush color" />
                  <div style={{ backgroundColor: LATEST_PRESET.lipColor }} className="w-5 h-5 rounded-full border border-stone-200" title="Lip color" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <div className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wide">
                Filter Shift: {LATEST_PRESET.filter?.toUpperCase()}
              </div>
              <button 
                onClick={() => handleTryOn(LATEST_PRESET)}
                className="bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl cursor-pointer shadow-sm hover:scale-[1.01] transition-all flex items-center gap-1.5"
              >
                Instant Try-On <ArrowRight className="w-3.5 h-3.5 text-[#bc8381]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXPLANATORY STUDIO FOOTER BAR */}
      <section className="rounded-2xl border border-[#bc8381]/20 bg-stone-50 p-5 shadow-xs text-left">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#bc8381]">Studio Library Notice</div>
            <h3 className="mt-1 text-sm font-serif font-bold text-stone-900">Try On Presets and Sandbox Customizations are Kept Synchronized</h3>
            <p className="mt-1 text-[11px] font-semibold text-stone-500">Formulas you upvote can be immediately released into the Try On library, and subsequently mixed and customized further in the sandbox.</p>
          </div>
          <button
            onClick={() => onNavigate('built-looks')}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#732729] px-4.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xs"
          >
            Open Presets Catalog
          </button>
        </div>
      </section>

    </div>
  );
};
