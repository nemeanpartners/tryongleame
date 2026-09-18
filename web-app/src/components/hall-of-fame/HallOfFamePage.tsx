import React from 'react';
import { Award, Play, Calendar, Sparkles, Sliders } from 'lucide-react';
import { Winner, PresetLook } from '../../types';

const HISTORICAL_WINNERS: Winner[] = [
  {
    id: 'w_1',
    username: 'sofia_beauty',
    lookName: 'Ethereal Siren',
    month: 'July 2026',
    description: 'A cooling oceanic aqua eye with a highly saturated coral lip and soft golden blush, reflecting high-gloss beachside sunset vibes.',
    imagePreset: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
    makeupConfig: {
      eyeshadowColor: '#06b6d4',
      blushColor: '#fb7185',
      lipColor: '#f43f5e',
      lashesStyle: 'glam'
    }
  },
  {
    id: 'w_2',
    username: 'cosmic_jade',
    lookName: 'Cyberpunk Violet',
    month: 'June 2026',
    description: 'An electric magenta and purple aesthetic with bold winged wispy lashes and futuristic cool filter integration.',
    imagePreset: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
    makeupConfig: {
      eyeshadowColor: '#8b5cf6',
      blushColor: '#ec4899',
      lipColor: '#a21caf',
      lashesStyle: 'wispy'
    }
  },
  {
    id: 'w_3',
    username: 'autumn_glaze',
    lookName: 'Sunset Silk',
    month: 'May 2026',
    description: 'Cozy rustic copper tones with heavy golden glow overlays and ultra gloss satin terracotta lips.',
    imagePreset: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600',
    makeupConfig: {
      eyeshadowColor: '#d97706',
      blushColor: '#f43f5e',
      lipColor: '#be123c',
      lashesStyle: 'natural'
    }
  }
];

interface HallOfFamePageProps {
  onSelectWinningLookForTryOn: (preset: PresetLook) => void;
}

export const HallOfFamePage: React.FC<HallOfFamePageProps> = ({ onSelectWinningLookForTryOn }) => {
  
  const handleTryOnWinner = (winner: Winner) => {
    const preset: PresetLook = {
      id: winner.id,
      name: winner.lookName,
      description: winner.description,
      eyeshadowColor: winner.makeupConfig.eyeshadowColor,
      eyeshadowOpacity: 0.7,
      blushColor: winner.makeupConfig.blushColor,
      blushOpacity: 0.45,
      lipColor: winner.makeupConfig.lipColor,
      lipOpacity: 0.85,
      lipGloss: true,
      lashesStyle: winner.makeupConfig.lashesStyle as any,
      glitterLevel: winner.id === 'w_1' ? 60 : winner.id === 'w_2' ? 50 : 20,
      filter: winner.id === 'w_1' ? 'holographic' : winner.id === 'w_2' ? 'cool-cyber' : 'warm-glow'
    };
    onSelectWinningLookForTryOn(preset);
  };

  return (
    <div id="hall-of-fame-page" className="space-y-8 animate-in fade-in duration-300 text-stone-800">
      
      {/* FEATURED PREVIOUS WINNER HEADER */}
      <div className="bg-gradient-to-tr from-[#2A1715] via-[#1C1917] to-[#B8887A]/30 border border-[#B8887A]/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl text-white">
        <div className="space-y-3 max-w-2xl text-left">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 border border-white/20 text-[#FAF6F5] p-1.5 rounded-lg shrink-0">
              <Award className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-[#B8887A]">TryON Beauty Hall of Fame</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-white leading-tight uppercase">
            Featured Look: <span className="font-light text-[#f5eae7]/90 italic">{HISTORICAL_WINNERS[0].lookName}</span>
          </h2>
          <p className="text-xs text-[#f5eae7]/85 leading-relaxed font-semibold">
            Designed by community legend <span className="font-bold text-white">@{HISTORICAL_WINNERS[0].username}</span>, 
            this look completely captured the July "Ethereal Siren" contest with its majestic oceanic hues and satin lip glow. Examine the formula specs instantly inside the Look Sandbox!
          </p>
          <div className="flex flex-wrap gap-2 pt-2 text-[10px] font-bold text-white/90">
            <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
              🎨 Eyes: {HISTORICAL_WINNERS[0].makeupConfig.eyeshadowColor.toUpperCase()}
            </span>
            <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
              💄 Lips: {HISTORICAL_WINNERS[0].makeupConfig.lipColor.toUpperCase()}
            </span>
            <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
              ✨ Filter: Prismatic Holographic
            </span>
          </div>
        </div>

        <button
          onClick={() => handleTryOnWinner(HISTORICAL_WINNERS[0])}
          className="bg-white hover:bg-[#B8887A] hover:text-white text-[#2A1715] font-extrabold tracking-widest uppercase text-[10px] py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shrink-0 w-full md:w-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Try Sofia's Formula
        </button>
      </div>

      {/* HISTORICAL GALLERY */}
      <div>
        <div className="border-b border-[#B8887A]/30 pb-3.5 mb-6 text-left">
          <h3 className="text-lg font-display font-bold uppercase tracking-wider text-[#2A1715]">Historical Monthly Winners</h3>
          <p className="text-xs text-stone-500">Discover winning designs, customized palettes, and formula guidelines from past competitions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HISTORICAL_WINNERS.map((winner) => (
            <div
              key={winner.id}
              className="group bg-white rounded-2xl border border-[#B8887A]/25 hover:border-[#2A1715]/30 overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-[0_10px_25px_rgba(115,39,41,0.06)]"
            >
              {/* Cover Image representing the style */}
              <div className="h-48 bg-stone-100 relative flex items-center justify-center border-b border-[#B8887A]/15 overflow-hidden">
                <img 
                  src={winner.imagePreset} 
                  alt={winner.lookName} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
                
                {/* Visual mini tag overlay */}
                <div className="absolute bottom-3 left-4 z-10 bg-white/95 backdrop-blur-md py-1.5 px-2.5 rounded-lg border border-[#B8887A]/25 text-left shadow-sm">
                  <span className="text-[9px] font-black uppercase text-[#2A1715] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#2A1715]" /> {winner.month}
                  </span>
                  <div className="font-extrabold text-stone-800 text-xs mt-0.5">@{winner.username}</div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="text-left space-y-2">
                  <h4 className="font-display font-black text-[#2A1715] text-base group-hover:text-[#B8887A] transition-colors">
                    {winner.lookName}
                  </h4>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed line-clamp-3">
                    {winner.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Color Swatch row */}
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Palette Recipe</span>
                    <div className="flex gap-1.5">
                      <div style={{ backgroundColor: winner.makeupConfig.eyeshadowColor }} className="w-4 h-4 rounded-full border border-stone-200" title="Eyeshadow" />
                      <div style={{ backgroundColor: winner.makeupConfig.blushColor }} className="w-4 h-4 rounded-full border border-stone-200" title="Blush" />
                      <div style={{ backgroundColor: winner.makeupConfig.lipColor }} className="w-4 h-4 rounded-full border border-stone-200" title="Lip Color" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleTryOnWinner(winner)}
                    className="w-full bg-[#faf6f5] hover:bg-[#2A1715] hover:text-white border border-[#B8887A]/25 text-[#2A1715] text-[10px] font-bold tracking-widest uppercase py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" /> Load Winner Formula
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
