import React from 'react';
import { Sparkles, Trophy, Flame, TrendingUp, Sliders, ArrowRight, Grid } from 'lucide-react';

interface HomepageProps {
  onNavigate: (tab: 'sandbox' | 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes') => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onNavigate }) => {
  return (
    <div id="homepage" className="space-y-12 animate-in fade-in duration-300">
      
      {/* LUXURIOUS EDITORIAL HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-[#bc8381]/30 bg-gradient-to-tr from-[#5c1d1f] via-[#732729] to-[#883639] p-8 md:p-12 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#bc8381]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-2xl space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-[#f5eae7]">
            <Sparkles className="w-3.5 h-3.5 text-[#bc8381]" /> Premium Filter Engineering Suite
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-wide leading-tight uppercase">
            TryON Beauty <span className="font-light text-[#f5eae7]/85 italic block">Look LAB</span>
          </h1>
          
          <p className="text-sm md:text-base text-[#f5eae7]/80 leading-relaxed max-w-lg">
            Welcome to the ultimate digital beauty filter blueprint registry. Formulate exquisite cosmetic shade recipes, configure luxury interactive shaders, and vote on community masterpieces.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => onNavigate('sandbox')}
              className="px-6 py-3.5 bg-white text-[#732729] font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-[#bc8381] hover:text-white transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4" /> Open Blueprint Studio <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('gallery')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              Explore Gallery
            </button>
          </div>
        </div>
      </section>

      {/* CORE MENU SECTIONS GRID - Premium warm cream cards */}
      <section className="space-y-6">
        <div className="border-b border-[#bc8381]/30 pb-4 text-left">
          <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-[#732729]">Explore Cosmetic Blueprints</h2>
          <p className="text-xs text-stone-500">Discover trending velvet shade recipes, legendary halls of fame, and interactive designer proposals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Menu Card 1: Sandbox Studio */}
          <div 
            onClick={() => onNavigate('sandbox')}
            className="group relative h-80 rounded-2xl border border-[#bc8381]/25 overflow-hidden bg-[#FAF6F5] flex flex-col justify-end p-6 cursor-pointer hover:border-[#732729]/50 hover:shadow-[0_12px_30px_rgba(115,39,41,0.08)] transition-all"
          >
            <div 
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4d191b] via-[#4d191b]/45 to-transparent" />
            <div className="relative space-y-2 text-left z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#bc8381]">Formula Studio</span>
              <h3 className="text-lg font-serif font-bold text-white uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#bc8381]" /> Sandbox Lab
              </h3>
              <p className="text-xs text-white/80 line-clamp-2">Configure custom blush shades, lash styles, and glitter intensities in real-time.</p>
              <div className="pt-2 text-[10px] font-bold text-[#f5eae7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Configure Formulas <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Menu Card 2: Community Gallery */}
          <div 
            onClick={() => onNavigate('gallery')}
            className="group relative h-80 rounded-2xl border border-[#bc8381]/25 overflow-hidden bg-[#FAF6F5] flex flex-col justify-end p-6 cursor-pointer hover:border-[#732729]/50 hover:shadow-[0_12px_30px_rgba(115,39,41,0.08)] transition-all"
          >
            <div 
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4d191b] via-[#4d191b]/45 to-transparent" />
            <div className="relative space-y-2 text-left z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#bc8381]">Submissions Hub</span>
              <h3 className="text-lg font-serif font-bold text-white uppercase flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#bc8381]" /> Community Gallery
              </h3>
              <p className="text-xs text-white/80 line-clamp-2">Try on and vote for custom cosmetic profiles formulated by creators around the world.</p>
              <div className="pt-2 text-[10px] font-bold text-[#f5eae7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Enter Gallery <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Menu Card 3: Legends / Hall of Fame */}
          <div 
            onClick={() => onNavigate('hall-of-fame')}
            className="group relative h-80 rounded-2xl border border-[#bc8381]/25 overflow-hidden bg-[#FAF6F5] flex flex-col justify-end p-6 cursor-pointer hover:border-[#732729]/50 hover:shadow-[0_12px_30px_rgba(115,39,41,0.08)] transition-all"
          >
            <div 
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4d191b] via-[#4d191b]/45 to-transparent" />
            <div className="relative space-y-2 text-left z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#bc8381]">Legends</span>
              <h3 className="text-lg font-serif font-bold text-white uppercase flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#bc8381]" /> Hall of Fame
              </h3>
              <p className="text-xs text-white/80 line-clamp-2">Exquisite beauty designs crowned as historic contest-winning masterpieces.</p>
              <div className="pt-2 text-[10px] font-bold text-[#f5eae7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View Winners <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Menu Card 4: Trending Proposals */}
          <div 
            onClick={() => onNavigate('trending')}
            className="group relative h-80 rounded-2xl border border-[#bc8381]/25 overflow-hidden bg-[#FAF6F5] flex flex-col justify-end p-6 cursor-pointer hover:border-[#732729]/50 hover:shadow-[0_12px_30px_rgba(115,39,41,0.08)] transition-all"
          >
            <div 
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4d191b] via-[#4d191b]/45 to-transparent" />
            <div className="relative space-y-2 text-left z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#bc8381]">Active Proposals</span>
              <h3 className="text-lg font-serif font-bold text-white uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#bc8381]" /> Demand Board
              </h3>
              <p className="text-xs text-white/80 line-clamp-2">See what beauty features and shader parameters the community is actively requesting.</p>
              <div className="pt-2 text-[10px] font-bold text-[#f5eae7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View Proposals <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Menu Card 5: Vote the Look */}
          <div 
            onClick={() => onNavigate('votes')}
            className="group relative h-80 rounded-2xl border border-[#bc8381]/25 overflow-hidden bg-[#FAF6F5] flex flex-col justify-end p-6 cursor-pointer hover:border-[#732729]/50 hover:shadow-[0_12px_30px_rgba(115,39,41,0.08)] transition-all"
          >
            <div 
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4d191b] via-[#4d191b]/45 to-transparent" />
            <div className="relative space-y-2 text-left z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#bc8381]">Interactive Pipeline</span>
              <h3 className="text-lg font-serif font-bold text-white uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#bc8381]" /> Vote the Look
              </h3>
              <p className="text-xs text-white/80 line-clamp-2">Directly upvote preset candidates to fast-track them into the studio registry.</p>
              <div className="pt-2 text-[10px] font-bold text-[#f5eae7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Vote & Build <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Menu Card 6: Packaged Presets */}
          <div 
            onClick={() => onNavigate('built-looks')}
            className="group relative h-80 rounded-2xl border border-[#bc8381]/25 overflow-hidden bg-[#FAF6F5] flex flex-col justify-end p-6 cursor-pointer hover:border-[#732729]/50 hover:shadow-[0_12px_30px_rgba(115,39,41,0.08)] transition-all"
          >
            <div 
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4d191b] via-[#4d191b]/45 to-transparent" />
            <div className="relative space-y-2 text-left z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#bc8381]">Professional Presets</span>
              <h3 className="text-lg font-serif font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#bc8381]" /> Studio Catalog
              </h3>
              <p className="text-xs text-white/80 line-clamp-2">Explore the pre-formulated professional recipes optimized for digital deployment.</p>
              <div className="pt-2 text-[10px] font-bold text-[#f5eae7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View Presets <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* HIGHLIGHT PROMOTION BANNER */}
      <section className="p-8 rounded-2xl border border-[#bc8381]/30 bg-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#732729] animate-pulse shrink-0" />
            <span className="text-[10px] font-black uppercase text-[#732729] tracking-widest">Active Challenge</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-[#732729]">Active Prismatic Heatwave Design Challenge</h3>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
            Tweak and perfect formula specifications inside our interactive blueprint engine. Save recipes and submit your blueprint to join the active monthly contest.
          </p>
        </div>
        <button
          onClick={() => onNavigate('sandbox')}
          className="px-5 py-3 bg-[#732729] hover:bg-[#5c1d1f] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap"
        >
          Open Editor
        </button>
      </section>
    </div>
  );
};

