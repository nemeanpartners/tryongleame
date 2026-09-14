import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  ArrowLeft, 
  Flame, 
  Filter, 
  Check, 
  Eye, 
  Info, 
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkle
} from 'lucide-react';
import { ShadeProduct, PresetLook } from '../../types';
import { SHADE_PRODUCTS } from '../../data/shadeProducts';
import { ShadeInterestModal } from './ShadeInterestModal';
import { trackShadeTried, trackShopClick } from '../../lib/analytics';

interface ShadeEditPageProps {
  onNavigate: (tab: any) => void;
  onLoadPreset: (preset: PresetLook) => void;
}

export const ShadeEditPage: React.FC<ShadeEditPageProps> = ({
  onNavigate,
  onLoadPreset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'eyelashes' | 'lips' | 'lip-liner' | 'eyeliner'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ShadeProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userInterests, setUserInterests] = useState<Record<string, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('kobella_shade_interests') || '{}');
      return Object.keys(saved).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    } catch {
      return {};
    }
  });

  const categories = [
    { id: 'all' as const, label: 'All Single Products' },
    { id: 'eyelashes' as const, label: 'Eyelashes' },
    { id: 'lips' as const, label: 'Lips' },
    { id: 'lip-liner' as const, label: 'Lip Liner' },
    { id: 'eyeliner' as const, label: 'Eyeliner' },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? SHADE_PRODUCTS
    : SHADE_PRODUCTS.filter(p => p.category === selectedCategory);

  const handleOpenProduct = (product: ShadeProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleTryOnSingleProduct = (e: React.MouseEvent, product: ShadeProduct) => {
    e.stopPropagation();
    trackShadeTried(product.name, product.categoryLabel, product.presetConfig?.eyeshadowColor || product.presetConfig?.lipColor || '#E91E63');
    onLoadPreset(product.presetConfig);
  };

  const handleQuickInterest = (e: React.MouseEvent, product: ShadeProduct) => {
    e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem('kobella_shade_interests') || '{}');
      const isInterested = !!userInterests[product.id];
      if (isInterested) {
        delete saved[product.id];
      } else {
        saved[product.id] = { timestamp: Date.now(), productName: product.name };
        trackShopClick(product.id, product.name, 'TryOn Shade', '$22.00', 'Batch Waitlist');
      }
      localStorage.setItem('kobella_shade_interests', JSON.stringify(saved));
      setUserInterests(prev => ({ ...prev, [product.id]: !isInterested }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 text-stone-900 pb-28 max-w-5xl mx-auto text-left">
      
      {/* 1. Header & Navigation Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 hover:text-black transition-colors cursor-pointer mr-1"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#E91E63] uppercase tracking-widest">
              Single Product Lab
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black font-sans">
            Shade Edit Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium max-w-xl">
            Individual curated lashes, lips, lip liners, and eyeliners. Try any single product live on your camera, and vote to trigger limited production batch drops.
          </p>
        </div>

        {/* How It Works Pill */}
        <div className="p-3.5 rounded-2xl bg-[#FFF6F7] border border-[#F7C6D7] flex items-center gap-3 shrink-0 shadow-xs max-w-xs">
          <div className="w-8 h-8 rounded-full bg-[#E91E63] text-white flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="text-[11px] font-bold text-black uppercase tracking-wider">Demand-Based Drops</h4>
            <p className="text-[10px] text-stone-600 leading-tight mt-0.5">500 interest votes = batch gets produced & sold</p>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-black text-white shadow-md'
                : 'bg-white hover:bg-stone-100 text-stone-600 border border-[#EDE7E3]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {filteredProducts.map((product) => {
          const isInterested = !!userInterests[product.id];
          const displayCount = product.currentInterests + (isInterested ? 1 : 0);
          const percent = Math.min(100, Math.round((displayCount / product.targetInterests) * 100));

          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleOpenProduct(product)}
              className="group relative rounded-3xl overflow-hidden bg-white border border-[#EDE7E3] hover:border-[#B8887A] p-3.5 sm:p-4 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              {/* Product Image Box */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 border border-[#EDE7E3] mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />

                {/* Gradient for badge contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

                {/* Top Left Category Pill */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider border border-white/10">
                    {product.categoryLabel}
                  </span>
                </div>

                {/* TOP RIGHT CORNER: TRY ON BUTTON (Dedicated single product try-on) */}
                <button
                  onClick={(e) => handleTryOnSingleProduct(e, product)}
                  className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-full bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] text-[10px] font-black uppercase tracking-wider shadow-xs border border-[#EBC9D6] flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                  title={`Try on ${product.name} live`}
                >
                  <Sparkles className="w-3 h-3 text-[#2A1715] animate-pulse" />
                  <span>Try On</span>
                </button>

                {/* Bottom Shade Swatch Tag */}
                <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[9.5px] font-bold text-black shadow-xs truncate max-w-[80%]">
                    {product.shadeName}
                  </span>
                  {product.colorHex && (
                    <span 
                      className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0" 
                      style={{ backgroundColor: product.colorHex }}
                    />
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-black group-hover:text-[#E91E63] transition-colors leading-tight line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-stone-500 font-medium line-clamp-1 mt-0.5">
                    {product.finish}
                  </p>
                </div>

                {/* Demand Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#E91E63]" />
                      <strong>{displayCount}</strong> / {product.targetInterests}
                    </span>
                    <span className="text-[#E91E63] font-bold">{percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#E91E63] rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 border-t border-[#EDE7E3] flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleQuickInterest(e, product)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isInterested
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-100 hover:bg-[#FFF0F4] text-stone-700 hover:text-[#E91E63]'
                    }`}
                  >
                    {isInterested ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Interested</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-3 h-3 text-[#E91E63]" />
                        <span>I Want This</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] font-bold text-stone-900 shrink-0">
                    {product.priceEstimate}
                  </span>
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* 4. Bottom Information Callout */}
      <div className="rounded-3xl border border-[#EDE7E3] bg-[#FAF6F4] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 text-left">
          <span className="px-2.5 py-0.5 rounded-full bg-[#E91E63] text-white text-[9px] font-bold uppercase tracking-widest">
            Community-Driven Formulas
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-black">
            Have a custom shade or product formula in mind?
          </h3>
          <p className="text-xs text-stone-600 max-w-lg leading-relaxed">
            Jump into the Mix & Match Creator Studio to formulate your dream pigment, eyelashes, or eyeliner, and publish it to the community to gather drop votes!
          </p>
        </div>

        <button
          onClick={() => onNavigate('sandbox')}
          className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-black hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Open Creator Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Shade Interest Detail Modal */}
      <ShadeInterestModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTryOn={(preset) => onLoadPreset(preset)}
      />

    </div>
  );
};
