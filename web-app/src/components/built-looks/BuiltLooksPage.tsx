import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Flame, Sliders, RefreshCw } from 'lucide-react';
import { PresetLook } from '../../types';
import { seedBuiltLooksIfEmpty, ExtendedBuiltLook } from '../../lib/looksService';

const LOOK_COVERS: Record<string, string> = {
  'sunset_silk': 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600',
  'cyberpunk_violet': 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
  'ethereal_glow': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'holo_heatwave': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600'
};

interface BuiltLooksPageProps {
  onLoadPreset: (preset: PresetLook) => void;
}

export const BuiltLooksPage: React.FC<BuiltLooksPageProps> = ({ onLoadPreset }) => {
  const [looks, setLooks] = useState<ExtendedBuiltLook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLooks = async () => {
    setLoading(true);
    try {
      const fetched = await seedBuiltLooksIfEmpty();
      setLooks(fetched);
    } catch (error) {
      console.error("Error loading built looks in catalog: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLooks();
  }, []);

  return (
    <div id="built-looks-page" className="space-y-8 animate-in fade-in duration-300 text-stone-800">
      
      {/* HEADER */}
      <div className="border-b border-[#bc8381]/30 pb-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold uppercase tracking-wider flex items-center gap-2 text-[#732729]">
            <Sparkles className="w-5 h-5 text-[#bc8381]" /> Packaged Shaders & Presets
          </h2>
          <p className="text-xs text-stone-500">These pre-formulated professional recipes are ready for immediate deployment to active DeepAR filter profiles.</p>
        </div>
        <button
          onClick={fetchLooks}
          className="flex items-center gap-1 bg-white hover:bg-[#FAF6F5] border border-[#bc8381]/35 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#bc8381]" /> Reload
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-7 h-7 animate-spin text-[#732729]" />
          <span className="text-xs font-bold text-[#732729]">Syncing packaged catalog...</span>
        </div>
      ) : (
        /* RECIPIES GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {looks.map((preset) => {
            const coverImg = preset.coverImage || LOOK_COVERS[preset.id] || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600';
            
            return (
              <div
                key={preset.id}
                className="group bg-white rounded-2xl border border-[#bc8381]/25 hover:border-[#732729]/30 overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-[0_10px_25px_rgba(115,39,41,0.06)] text-left"
              >
                {/* Cover Portrait */}
                <div className="h-56 bg-stone-100 relative overflow-hidden border-b border-[#bc8381]/15">
                  <img 
                    src={coverImg} 
                    alt={preset.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
                  
                  {/* Active Tag */}
                  {preset.id === 'holo_heatwave' && (
                    <div className="absolute top-3 right-3 bg-[#732729] border border-[#bc8381]/30 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider text-white flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 animate-pulse" /> Active Challenge
                    </div>
                  )}

                  {preset.isCustom && (
                    <div className="absolute top-3 right-3 bg-emerald-600 border border-emerald-500/30 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider text-white flex items-center gap-1">
                      ★ Community Release
                    </div>
                  )}

                  {/* Swatches Overlay */}
                  <div className="absolute bottom-3 left-3 flex gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg border border-[#bc8381]/25 shadow-sm">
                    <div style={{ backgroundColor: preset.eyeshadowColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200" title="Eyeshadow color" />
                    <div style={{ backgroundColor: preset.blushColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1" title="Blush color" />
                    <div style={{ backgroundColor: preset.lipColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1" title="Lip color" />
                  </div>
                </div>

                {/* Specs & Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-serif font-black text-[#732729] text-base group-hover:text-[#bc8381] transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-semibold line-clamp-3">
                      {preset.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Recipe Parameters */}
                    <div className="bg-[#faf6f5] rounded-xl p-3 border border-[#bc8381]/20 grid grid-cols-2 gap-2 text-[10px] text-stone-500 font-bold">
                      <div>
                        Filter: <span className="font-bold text-[#732729] uppercase">{preset.filter}</span>
                      </div>
                      <div>
                        Lashes: <span className="font-bold text-[#bc8381] uppercase">{preset.lashesStyle}</span>
                      </div>
                      <div>
                        Glitter: <span className="font-bold text-amber-600">{preset.glitterLevel}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        Gloss: <span className="font-bold text-emerald-600">{preset.lipGloss ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onLoadPreset(preset)}
                      className="w-full bg-[#faf6f5] hover:bg-[#732729] hover:text-white border border-[#bc8381]/25 text-[#732729] font-extrabold text-[10px] tracking-widest uppercase py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Configure Preset Recipe
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
