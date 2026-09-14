import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PresetLook } from '../../types';

interface RecommendationsAndSavedSectionProps {
  onTryOn: (preset: PresetLook) => void;
  onNavigate: (tab: 'sandbox' | 'votes' | 'gallery' | 'built-looks' | 'trending' | 'shade-edit' | 'profile') => void;
}

// Presets matching the "Because you tried Espresso" aesthetic
const CARAMEL_SMOKE_PRESET: PresetLook = {
  id: 'caramel_smoke',
  name: 'Caramel Smoke',
  description: 'Toasted caramel glaze, roasted cocoa lids, sculpted terracotta blush & warm espresso pout.',
  eyeshadowColor: '#8D5B4C',
  eyeshadowOpacity: 0.8,
  eyelinerColor: '#4A352F',
  eyelinerOpacity: 0.95,
  eyelinerStyle: 'winged',
  blushColor: '#DEAB77',
  blushOpacity: 0.55,
  lipColor: '#8D5B4C',
  lipOpacity: 0.9,
  lipGloss: true,
  lashesStyle: 'glam',
  glitterLevel: 35,
  filter: 'warm-glow',
};

const ROSE_ESPRESSO_PRESET: PresetLook = {
  id: 'rose_espresso',
  name: 'Rose Espresso',
  description: 'Soft dusty-rose veil, melted espresso liner, romantic mauve flush & glossy mocha lip.',
  eyeshadowColor: '#7E4844',
  eyeshadowOpacity: 0.75,
  eyelinerColor: '#4A352F',
  eyelinerOpacity: 0.85,
  eyelinerStyle: 'cat-eye',
  blushColor: '#D98A9F',
  blushOpacity: 0.5,
  lipColor: '#8D4B53',
  lipOpacity: 0.85,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 40,
  filter: 'vintage',
};

// Presets matching the "Your saved looks" aesthetic
const PINK_GLAZE_SAVED_PRESET: PresetLook = {
  id: 'pink_glaze_saved',
  name: 'Pink Glaze',
  description: 'Frosty lilac pastel wash, candy blush & ultra-high shine glass gloss.',
  eyeshadowColor: '#f472b6',
  eyeshadowOpacity: 0.75,
  eyelinerColor: '#831843',
  eyelinerOpacity: 0.8,
  eyelinerStyle: 'cat-eye',
  blushColor: '#ec4899',
  blushOpacity: 0.6,
  lipColor: '#db2777',
  lipOpacity: 0.85,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 70,
  filter: 'holographic',
};

const NIGHT_NUDE_SAVED_PRESET: PresetLook = {
  id: 'night_nude_saved',
  name: 'Night Nude',
  description: '90s deep contour, noir velvet shadow, muted chocolate lip & golden highlight.',
  eyeshadowColor: '#3D312E',
  eyeshadowOpacity: 0.85,
  eyelinerColor: '#1c1917',
  eyelinerOpacity: 0.95,
  eyelinerStyle: 'winged',
  blushColor: '#6F423B',
  blushOpacity: 0.45,
  lipColor: '#6F423B',
  lipOpacity: 0.9,
  lipGloss: false,
  lashesStyle: 'glam',
  glitterLevel: 20,
  filter: 'warm-glow',
};

export const RecommendationsAndSavedSection: React.FC<RecommendationsAndSavedSectionProps> = ({
  onTryOn,
  onNavigate,
}) => {
  return (
    <div className="space-y-10 text-left my-2">
      {/* ========================================================================= */}
      {/* SECTION 1: BECAUSE YOU TRIED ESPRESSO                                      */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div>
          <h3 className="font-satoshi text-2xl sm:text-[28px] font-bold text-stone-900 tracking-tight leading-snug">
            Because you tried Espresso
          </h3>
          <p className="font-satoshi text-sm sm:text-[15px] text-stone-500 font-medium mt-0.5">
            One more look, same mood.
          </p>
        </div>

        {/* 2 Look Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Caramel Smoke */}
          <div
            onClick={() => onTryOn(CARAMEL_SMOKE_PRESET)}
            className="group bg-white rounded-[28px] p-6 sm:p-7 border border-stone-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-stone-300 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            {/* 3 Swatch Dots */}
            <div className="flex items-center gap-2.5 mb-6">
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#8D5B4C' }}
                title="#8D5B4C Warm Brown"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#DEAB77' }}
                title="#DEAB77 Caramel Shimmer"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#4A352F' }}
                title="#4A352F Roasted Espresso"
              />
            </div>

            {/* Title and CTA */}
            <div>
              <h4 className="font-satoshi text-xl sm:text-[22px] font-bold text-stone-900 leading-tight">
                Caramel Smoke
              </h4>
              <p className="font-satoshi text-xs sm:text-sm text-stone-500 font-normal mt-1 flex items-center gap-1 group-hover:text-stone-900 transition-colors">
                <span>Try a warmer version</span>
                <span className="text-stone-500 group-hover:translate-x-0.5 transition-transform">→</span>
              </p>
            </div>
          </div>

          {/* Card 2: Rose Espresso */}
          <div
            onClick={() => onTryOn(ROSE_ESPRESSO_PRESET)}
            className="group bg-white rounded-[28px] p-6 sm:p-7 border border-stone-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-stone-300 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            {/* 3 Swatch Dots */}
            <div className="flex items-center gap-2.5 mb-6">
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#D98A9F' }}
                title="#D98A9F Dusty Rose"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#7E4844' }}
                title="#7E4844 Espresso Rose"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#DEAB77' }}
                title="#DEAB77 Soft Champagne Gold"
              />
            </div>

            {/* Title and CTA */}
            <div>
              <h4 className="font-satoshi text-xl sm:text-[22px] font-bold text-stone-900 leading-tight">
                Rose Espresso
              </h4>
              <p className="font-satoshi text-xs sm:text-sm text-stone-500 font-normal mt-1 flex items-center gap-1 group-hover:text-stone-900 transition-colors">
                <span>Try a softer version</span>
                <span className="text-stone-500 group-hover:translate-x-0.5 transition-transform">→</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: YOUR SAVED LOOKS                                                */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-satoshi text-2xl sm:text-[28px] font-bold text-stone-900 tracking-tight leading-snug">
              Your saved looks
            </h3>
            <p className="font-satoshi text-sm sm:text-[15px] text-stone-500 font-medium mt-0.5">
              Looks worth coming back to.
            </p>
          </div>

          {/* View all button */}
          <button
            onClick={() => onNavigate('built-looks')}
            className="font-satoshi text-sm sm:text-[15px] font-bold text-stone-800 hover:text-black flex items-center gap-1 cursor-pointer transition-colors shrink-0 group"
          >
            <span>View all</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        {/* 2 Saved Look Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Pink Glaze */}
          <div
            onClick={() => onTryOn(PINK_GLAZE_SAVED_PRESET)}
            className="group bg-white rounded-[28px] p-6 sm:p-7 border border-stone-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-stone-300 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            {/* 3 Swatch Dots */}
            <div className="flex items-center gap-2.5 mb-6">
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#D98A9F' }}
                title="#D98A9F Pink Glaze"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#DEAB77' }}
                title="#DEAB77 Golden Shimmer"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#8D4B53' }}
                title="#8D4B53 Deep Mauve"
              />
            </div>

            {/* Title and Timestamp */}
            <div>
              <h4 className="font-satoshi text-xl sm:text-[22px] font-bold text-stone-900 leading-tight">
                Pink Glaze
              </h4>
              <p className="font-satoshi text-xs sm:text-sm text-stone-500 font-normal mt-1">
                Saved 2 days ago
              </p>
            </div>
          </div>

          {/* Card 2: Night Nude */}
          <div
            onClick={() => onTryOn(NIGHT_NUDE_SAVED_PRESET)}
            className="group bg-white rounded-[28px] p-6 sm:p-7 border border-stone-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-stone-300 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            {/* 3 Swatch Dots */}
            <div className="flex items-center gap-2.5 mb-6">
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#3D312E' }}
                title="#3D312E Noir Brown"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#6F423B' }}
                title="#6F423B Velvet Espresso"
              />
              <span
                className="w-5.5 h-5.5 rounded-full shadow-2xs border border-black/5"
                style={{ backgroundColor: '#DEAB77' }}
                title="#DEAB77 Golden Nude"
              />
            </div>

            {/* Title and Timestamp */}
            <div>
              <h4 className="font-satoshi text-xl sm:text-[22px] font-bold text-stone-900 leading-tight">
                Night Nude
              </h4>
              <p className="font-satoshi text-xs sm:text-sm text-stone-500 font-normal mt-1">
                Saved last week
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
