import React from 'react';
import { ArrowRight, Crown, GalleryHorizontal, Heart, MessageSquare, Sparkles, Trophy } from 'lucide-react';

interface HomepageProps {
  onNavigate: (tab: 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes') => void;
}

const exploreCards = [
  {
    tab: 'gallery' as const,
    title: 'Challenge Gallery',
    eyebrow: 'Live entries',
    copy: 'Browse submitted looks, save favorites, and open community formulas.',
    icon: GalleryHorizontal,
  },
  {
    tab: 'votes' as const,
    title: 'Vote Board',
    eyebrow: 'Decide what ships',
    copy: 'Upvote active looks and help choose the next Gleame challenge winner.',
    icon: Heart,
  },
  {
    tab: 'trending' as const,
    title: 'Requests',
    eyebrow: 'Community asks',
    copy: 'See requested makeup styles and submit ideas for new presets.',
    icon: MessageSquare,
  },
  {
    tab: 'hall-of-fame' as const,
    title: 'Legends',
    eyebrow: 'Winning archive',
    copy: 'Review crowned looks and use them as inspiration for the next build.',
    icon: Trophy,
  },
];

export const Homepage: React.FC<HomepageProps> = ({ onNavigate }) => {
  return (
    <div id="homepage" className="space-y-8 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/[0.72] p-6 md:p-8 shadow-[0_24px_70px_rgba(20,20,20,0.10)] backdrop-blur-2xl">
        <div className="absolute inset-x-8 -top-20 h-44 bg-[#ff3f87]/18 blur-3xl pointer-events-none" />
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-[#d7b56d]/30 bg-[#d7b56d]/10 blur-sm pointer-events-none" />

        <div className="relative grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-5 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/[0.70] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#ff3f87]" />
              Explore Gleame
            </div>
            <div className="space-y-3">
              <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-normal text-stone-950 md:text-5xl">
                Discover looks worth trying.
              </h1>
              <p className="max-w-lg text-sm font-semibold leading-relaxed text-stone-500">
                Explore live challenges, vote on community favorites, and find winning makeup ideas. Use the native Looks portal below for camera try-on and build mode.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('gallery')}
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-[0_14px_30px_rgba(20,20,20,0.20)] transition-all hover:bg-stone-800"
              >
                Open Gallery <ArrowRight className="h-3.5 w-3.5 text-[#d7b56d]" />
              </button>
              <button
                onClick={() => onNavigate('votes')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/[0.76] px-5 py-3 text-xs font-black uppercase tracking-wider text-stone-700 shadow-sm transition-all hover:text-[#ff3f87]"
              >
                Vote Now
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-stone-950 p-5 text-white shadow-[0_18px_50px_rgba(20,20,20,0.24)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#d7b56d]">Active Challenge</div>
                <h2 className="mt-1 text-xl font-black">Holographic Heatwave</h2>
              </div>
              <Crown className="h-6 w-6 text-[#d7b56d]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Entries', '24'],
                ['Voting', 'Open'],
                ['Prize', 'Feature'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <div className="text-[10px] font-bold uppercase text-white/45">{label}</div>
                  <div className="mt-1 text-sm font-black">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {exploreCards.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => onNavigate(item.tab)}
              className="group rounded-[24px] border border-white/70 bg-white/[0.68] p-5 text-left shadow-[0_18px_45px_rgba(20,20,20,0.07)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[#ff3f87]/35 hover:bg-white"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="rounded-2xl border border-white/70 bg-stone-100 p-3 text-stone-800 transition-colors group-hover:text-[#ff3f87]">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-300 transition-colors group-hover:text-[#ff3f87]" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#d7b56d]">{item.eyebrow}</div>
              <h3 className="mt-1 text-lg font-black text-stone-950">{item.title}</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-stone-500">{item.copy}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/[0.62] p-5 shadow-[0_18px_45px_rgba(20,20,20,0.07)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#d7b56d]">Studio Library</div>
            <h3 className="mt-1 text-lg font-black text-stone-950">Preset looks are now kept separate from the try-on camera.</h3>
            <p className="mt-1 text-xs font-semibold text-stone-500">Use Explore for discovery, Looks for native try-on/build, and Lab for challenges.</p>
          </div>
          <button
            onClick={() => onNavigate('built-looks')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#ff3f87] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-[0_14px_30px_rgba(255,63,135,0.24)]"
          >
            View Presets
          </button>
        </div>
      </section>
    </div>
  );
};
