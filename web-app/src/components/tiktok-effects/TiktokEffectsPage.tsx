import React, { useState } from 'react';
import { Sparkles, ExternalLink, Heart, Video, Eye, ArrowUpRight } from 'lucide-react';

interface TiktokEffect {
  id: string;
  name: string;
  description: string;
  image: string;
  tiktokUrl: string;
  author: string;
  views: string;
  likes: string;
  category: string;
}

const TIKTOK_EFFECTS_DATA: TiktokEffect[] = [
  {
    id: 'sunset-glow',
    name: 'Sunset Glow Filter',
    description: 'A luminous, sun-kissed beauty filter featuring warm peachy blush, delicate golden highlight, and a glossy coral-pink lip tint.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    tiktokUrl: 'https://vt.tiktok.com/ZS9hKkunc5KF2-oXcAD/',
    author: '@TryOnBeauty',
    views: '1.2M',
    likes: '84.5K',
    category: 'Sunkissed'
  },
  {
    id: 'glass-skin',
    name: 'Glass Skin Pearl',
    description: 'Achieve an ultra-dewy, liquid-pearl complexion effect with subtle translucent pink flush and a glassy, high-shine lip lacquer.',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
    tiktokUrl: 'https://vt.tiktok.com/ZS9hKkunc5KF2-oXcAD/',
    author: '@TryOnBeauty',
    views: '890K',
    likes: '62.1K',
    category: 'Dewy'
  },
  {
    id: 'grunge-siren',
    name: '90s Grunge Siren',
    description: 'A rich, nostalgic aesthetic combining a perfectly blended smoky eye contour, matte chestnut lips, and a flawless satin base.',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
    tiktokUrl: 'https://vt.tiktok.com/ZS9hKkunc5KF2-oXcAD/',
    author: '@TryOnBeauty',
    views: '2.4M',
    likes: '195.3K',
    category: 'Retro'
  },
  {
    id: 'cold-girl',
    name: 'Cold Girl Winter',
    description: 'The viral frosted cheek flush featuring crisp silver-blue undertones, snowy white highlights, and a sheer berry pout.',
    image: 'https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&w=600&q=80',
    tiktokUrl: 'https://vt.tiktok.com/ZS9hKkunc5KF2-oXcAD/',
    author: '@TryOnBeauty',
    views: '3.1M',
    likes: '240.8K',
    category: 'Aesthetic'
  },
  {
    id: 'angelic-glaze',
    name: 'Angelic Glaze Filter',
    description: 'Incredibly soft, ethereal glow with baby pink satin eyelids, doll-like blush placement, and sparkling diamond highlights.',
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
    tiktokUrl: 'https://vt.tiktok.com/ZS9hKkunc5KF2-oXcAD/',
    author: '@TryOnBeauty',
    views: '1.7M',
    likes: '112.4K',
    category: 'Glow'
  },
  {
    id: 'bold-siren',
    name: 'Siren Velvet Red',
    description: 'Chic Parisian beauty effect highlighting a striking, ultra-defined matte ruby lip paired with a clean, sharp fox-eye wing.',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80',
    tiktokUrl: 'https://vt.tiktok.com/ZS9hKkunc5KF2-oXcAD/',
    author: '@TryOnBeauty',
    views: '4.5M',
    likes: '380.2K',
    category: 'High Glam'
  }
];

export const TiktokEffectsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Sunkissed', 'Dewy', 'Retro', 'Aesthetic', 'Glow', 'High Glam'];

  const filteredEffects = activeCategory === 'All'
    ? TIKTOK_EFFECTS_DATA
    : TIKTOK_EFFECTS_DATA.filter(item => item.category === activeCategory);

  const handleShare = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="tiktok-effects-page" className="space-y-8 animate-in fade-in duration-300 text-stone-800">
      
      {/* Page Header */}
      <div className="border-b border-[#B8887A]/30 pb-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2 text-[#2A1715]">
            <Video className="w-5 h-5 text-[#B8887A]" /> TikTok Effects Studio
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Tap on any viral AR effect we've custom formulated and published to try them directly on your device inside TikTok.
          </p>
        </div>

        {/* Categories filters */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-stone-950 text-white shadow-xs'
                  : 'bg-white/60 border border-stone-200/50 text-stone-600 hover:bg-white hover:text-stone-950'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEffects.map((effect) => (
          <a
            key={effect.id}
            href={effect.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col bg-white/70 backdrop-blur-md rounded-[20px] overflow-hidden border border-stone-200/50 hover:border-[#ff3f87]/40 shadow-xs hover:shadow-[0_16px_36px_rgba(255,63,135,0.08)] transition-all duration-300 transform hover:-translate-y-1.5"
          >
            {/* Aspect Ratio 3:4 for vertical portraits */}
            <div className="aspect-[3/4] relative w-full overflow-hidden bg-stone-100">
              {/* Badge */}
              <div className="absolute top-4 left-4 z-10 bg-stone-900/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                {effect.category}
              </div>

              {/* TikTok Badge */}
              <div className="absolute top-4 right-4 z-10 bg-[#ff3f87] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Video className="w-2.5 h-2.5 fill-current" />
                <span>TikTok</span>
              </div>

              {/* Image */}
              <img
                src={effect.image}
                alt={effect.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-[10px] font-black text-[#d7b56d] uppercase tracking-widest mb-1">
                  Active Try-on
                </span>
                <p className="text-white text-xs font-semibold flex items-center gap-1.5">
                  Tap to launch inside TikTok app <ArrowUpRight className="w-3.5 h-3.5 text-[#ff3f87]" />
                </p>
              </div>
            </div>

            {/* Content card footer */}
            <div className="p-5 flex-1 flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-display font-black text-stone-900 text-base leading-tight group-hover:text-[#ff3f87] transition-colors">
                    {effect.name}
                  </h3>
                  <span className="text-[10px] font-semibold text-stone-400">
                    by {effect.author}
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium leading-relaxed line-clamp-2">
                  {effect.description}
                </p>
              </div>

              {/* Stats & Launch Action */}
              <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-bold text-stone-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-stone-400" />
                    <span>{effect.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-stone-400 group-hover:text-red-500 transition-colors" />
                    <span>{effect.likes} likes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleShare(effect.id, effect.tiktokUrl, e)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all text-[10px] font-black uppercase tracking-wider"
                    title="Copy Link"
                  >
                    {copiedId === effect.id ? 'Copied' : 'Share'}
                  </button>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-900 group-hover:bg-[#ff3f87] text-white shadow-xs transition-all group-hover:scale-105">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Dynamic Info Banner */}
      <div className="bg-[#B8887A]/10 border border-[#B8887A]/20 p-5 rounded-2xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-display font-bold text-[#2A1715] text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#B8887A]" /> Want your custom design published?
          </h4>
          <p className="text-xs text-stone-600 leading-normal">
            Submit your formula via our **Mix & Match** editor and upvote on the **Vote Board**. Highly requested creations get packaged and published to our official TikTok library!
          </p>
        </div>
      </div>
      
    </div>
  );
};
