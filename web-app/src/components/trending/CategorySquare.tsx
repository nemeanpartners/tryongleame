import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export interface DemandCategoryStat {
  name: string;
  value: number;
  percentage: number;
}

interface CategorySquareProps {
  categories: DemandCategoryStat[];
  activeCategoryFilter: string | null;
  onSelectCategory: (name: string | null) => void;
}

import { PRODUCT_COLOURS, Product } from '../../lib/wantedProducts';

const colourFor = (name: string) => PRODUCT_COLOURS[name as Product] || '#C9BDB6';

/**
 * Which part of the face the board is asking for, as bars that reorder as they
 * move. No card of its own: it sits under the bag, so the tally and what is in
 * the bag read as the same thing.
 */
export const CategoryBars: React.FC<CategorySquareProps> = ({
  categories,
  activeCategoryFilter,
  onSelectCategory
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
        Wanted popularity
      </span>
      {activeCategoryFilter && (
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className="text-[10px] font-bold text-[#2A1715] hover:text-[#E91E63] cursor-pointer flex items-center gap-0.5 shrink-0"
        >
          <span>Reset</span>
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>

    {categories.map((stat) => {
      const isSelected = activeCategoryFilter === stat.name;
      return (
        <motion.button
          key={stat.name}
          layout
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          type="button"
          onClick={() => onSelectCategory(isSelected ? null : stat.name)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
            isSelected ? 'bg-white/80' : 'hover:bg-white/60'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: colourFor(stat.name) }}
          />
          <span className="text-[11px] font-bold text-stone-700 w-[74px] shrink-0 text-left">
            {stat.name}
          </span>
          <span className="grow h-2 rounded-full bg-white/70 overflow-hidden relative">
            <motion.span
              className="block h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${colourFor(stat.name)}55, ${colourFor(stat.name)})`
              }}
              initial={false}
              animate={{ width: `${stat.percentage}%` }}
              transition={{ type: 'spring', stiffness: 110, damping: 20 }}
            />
            {isSelected && (
              <span className="absolute inset-0 shimmer-sweep pointer-events-none" />
            )}
          </span>
          <span className="text-[11px] font-black text-stone-900 tabular-nums w-9 text-right shrink-0">
            {stat.percentage}%
          </span>
        </motion.button>
      );
    })}
  </div>
);
