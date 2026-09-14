import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Heart, Plus, Sparkles, Filter, Check } from 'lucide-react';
import { WantedLookItem } from './WantedQuickActionCard';

interface WantedListViewModalProps {
  items: WantedLookItem[];
  votedMap: Record<string, boolean>;
  onToggleWant: (e: React.MouseEvent, id: string) => void;
  onRequestClick: () => void;
  onClose: () => void;
}

export const WantedListViewModal: React.FC<WantedListViewModalProps> = ({
  items,
  votedMap,
  onToggleWant,
  onRequestClick,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const categories = ['All', 'Eyes', 'Lips', 'Blush', 'Highlight'];

  const filteredItems = items.filter(item => {
    const matchesSearch = search.trim() === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.requestedBy && item.requestedBy.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleWantClick = (e: React.MouseEvent, id: string) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 900);
    onToggleWant(e, id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#bc8381]/25 overflow-hidden text-left relative">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-start justify-between gap-4 bg-gradient-to-b from-[#faf6f5] to-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Community Wanted List
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#732729]/10 text-[#732729] text-xs font-bold">
                {items.length} looks
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Browse and vote on beauty formulas requested by creators & artists.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRequestClick}
              className="px-3.5 py-1.5 bg-[#732729] hover:bg-[#5a1e20] text-white text-xs font-bold rounded-full transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-white space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search requested shaders, formulas, or concepts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-[#faf6f5] border border-[#bc8381]/25 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#732729]/50 placeholder-stone-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-[#732729] text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200/70 text-stone-600'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-stone-100">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <p className="text-sm font-bold text-stone-600">No requested looks found</p>
              <p className="text-xs">Try clearing your filters or submit a new proposal!</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isVoted = !!votedMap[item.id];
              const isAnimating = animatingId === item.id;

              return (
                <div
                  key={item.id}
                  className="py-3.5 sm:py-4 flex items-center justify-between gap-3 group hover:bg-stone-50/80 -mx-2 px-2.5 rounded-2xl transition-colors"
                >
                  {/* Left: Swatch Icon & Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xs shrink-0 flex items-center justify-center border border-black/5 mt-0.5">
                      {item.swatchType === 'concentric' ? (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: item.colors[0] }}
                        >
                          <div 
                            className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                            style={{ backgroundColor: item.colors[1] || '#ffffff' }}
                          />
                        </div>
                      ) : item.swatchType === 'gradient' ? (
                        <div 
                          className="w-full h-full"
                          style={{ 
                            background: `linear-gradient(135deg, ${item.colors[0]} 0%, ${item.colors[1] || item.colors[0]} 100%)` 
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full"
                          style={{ backgroundColor: item.colors[0] }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#732729] transition-colors leading-tight">
                          {item.name}
                        </h3>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {item.category}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-400 font-medium">
                        <span>{item.countLabel}</span>
                        {item.requestedBy && (
                          <>
                            <span>•</span>
                            <span>Requested by @{item.requestedBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: WANT Button */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleWantClick(e, item.id)}
                      className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-2xs ${
                        isVoted
                          ? 'bg-[#732729] text-white border-[#732729]'
                          : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <motion.div
                        animate={
                          isAnimating 
                            ? { scale: [1, 1.6, 1.2, 1], rotate: [0, -12, 12, 0] } 
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      >
                        <Heart 
                          className={`w-4 h-4 transition-colors ${
                            isVoted 
                              ? 'text-white fill-white' 
                              : 'text-stone-700'
                          }`} 
                        />
                      </motion.div>
                      <span className="tracking-wide uppercase text-[11px]">
                        {isVoted ? 'WANTED' : 'WANT'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isAnimating && (
                        <motion.div
                          initial={{ opacity: 1, y: 0, scale: 0.6 }}
                          animate={{ opacity: 0, y: -24, scale: 1.3 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute -top-3 right-4 pointer-events-none text-rose-500 font-extrabold text-[10px] flex items-center gap-0.5 z-20"
                        >
                          <span>♥</span>
                          <span>+1</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#faf6f5] flex items-center justify-between text-xs text-stone-500">
          <span>Top community shaders get engineered into the try-on library each release cycle.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
