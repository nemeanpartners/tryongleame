import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Flame, Sliders, RefreshCw, Heart } from 'lucide-react';
import { PresetLook } from '../../types';
import { seedBuiltLooksIfEmpty, ExtendedBuiltLook } from '../../lib/looksService';
import { PostSaveDiscoverModal } from '../common/PostSaveDiscoverModal';

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
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tryon_favourites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState<boolean>(false);
  const [savedLookNameForModal, setSavedLookNameForModal] = useState<string>('');

  const toggleFavorite = (lookId: string, e: React.MouseEvent, lookName?: string) => {
    e.stopPropagation();
    const isCurrentlySaved = favorites.includes(lookId);
    const willBeSaved = !isCurrentlySaved;

    setFavorites(prev => {
      const updated = willBeSaved
        ? [...prev, lookId]
        : prev.filter(id => id !== lookId);
      localStorage.setItem('tryon_favourites', JSON.stringify(updated));
      return updated;
    });

    if (willBeSaved) {
      setSavedLookNameForModal(lookName || 'Look');
      setIsPostSaveModalOpen(true);
    }
  };

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
      <div className="border-b border-[#EDE7E3] pb-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2 text-black font-sans">
            <Sparkles className="w-5 h-5 text-[#E91E63]" /> Try On Looks
          </h2>
          <p className="text-xs text-stone-500 font-medium">Curated high-fashion recipes ready for real-time camera simulation and custom mixing.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLooks}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F7F2EF] border border-[#EDE7E3] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-black" /> Reload
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-7 h-7 animate-spin text-[#E91E63]" />
          <span className="text-xs font-bold text-black">Loading look formulas...</span>
        </div>
      ) : (
        /* RECIPIES GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {looks.map((preset) => {
            const coverImg = preset.coverImage || LOOK_COVERS[preset.id] || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600';
            const isFav = favorites.includes(preset.id);
            
            return (
              <div
                key={preset.id}
                className="group bg-white rounded-3xl border border-[#EDE7E3] hover:border-[#B8887A] overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md text-left"
              >
                {/* Cover Portrait */}
                <div className="h-56 bg-stone-100 relative overflow-hidden border-b border-[#EDE7E3]">
                  <img 
                    src={coverImg} 
                    alt={preset.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
                  
                  {/* Active Tag */}
                  {preset.id === 'holo_heatwave' && (
                    <div className="absolute top-3 right-3 bg-[#E91E63] border border-white/20 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 animate-pulse" /> Active Challenge
                    </div>
                  )}

                  {preset.isCustom && (
                    <div className="absolute top-3 right-3 bg-black border border-white/20 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                      ★ Community Drop
                    </div>
                  )}

                  {preset.requestedBy && (
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full text-[8px] font-bold tracking-wider uppercase">
                      MUA: @{preset.requestedBy}
                    </div>
                  )}

                  {/* Favorite Heart Button Overlay */}
                  <button
                    onClick={(e) => toggleFavorite(preset.id, e, preset.name)}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-white/95 backdrop-blur-md border border-[#EDE7E3] hover:bg-[#FFF6F7] transition-all cursor-pointer shadow-sm text-stone-600 hover:text-[#E91E63] z-10"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-[#E91E63] text-[#E91E63]' : 'text-stone-500'}`} />
                  </button>

                  {/* Swatches Overlay */}
                  <div className="absolute bottom-3 left-3 flex gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full border border-[#EDE7E3] shadow-sm">
                    <div style={{ backgroundColor: preset.eyeshadowColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200" title="Eyeshadow color" />
                    <div style={{ backgroundColor: preset.blushColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1" title="Blush color" />
                    <div style={{ backgroundColor: preset.lipColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1" title="Lip color" />
                  </div>
                </div>

                {/* Specs & Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-black text-base group-hover:text-[#E91E63] transition-colors font-sans">
                        {preset.name}
                      </h3>
                      {isFav && <span className="text-[#E91E63] text-xs">♥</span>}
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed font-normal line-clamp-2">
                      {preset.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Recipe Parameters */}
                    <div className="bg-[#F7F2EF] rounded-2xl p-3 border border-[#EDE7E3] grid grid-cols-2 gap-2 text-[10px] text-stone-600 font-medium">
                      <div>
                        Filter: <span className="font-bold text-black uppercase">{preset.filter}</span>
                      </div>
                      <div>
                        Lashes: <span className="font-bold text-[#E91E63] uppercase">{preset.lashesStyle}</span>
                      </div>
                      <div>
                        Glitter: <span className="font-bold text-black">{preset.glitterLevel}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        Gloss: <span className="font-bold text-[#E91E63]">{preset.lipGloss ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onLoadPreset(preset)}
                      className="w-full bg-black hover:bg-stone-800 text-white font-bold text-[10px] tracking-wider uppercase py-2.5 rounded-full cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
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

      {/* Post-Save Discover Modal: SAVE → DISCOVER AGAIN */}
      <PostSaveDiscoverModal
        isOpen={isPostSaveModalOpen}
        onClose={() => setIsPostSaveModalOpen(false)}
        savedLookName={savedLookNameForModal}
        onTryOn={(preset) => onLoadPreset(preset)}
      />
    </div>
  );
};
