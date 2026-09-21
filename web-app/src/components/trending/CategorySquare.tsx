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

/** Each category keeps its own dot colour wherever it appears. */
const CATEGORY_COLOURS: Record<string, string> = {
  Eyes: '#2A1715',
  Lips: '#E91E63',
  Blush: '#B8887A',
  Highlight: '#D8A7B1',
  'Full Face': '#7A5C52',
  Other: '#C9BDB6'
};

const colourFor = (name: string) => CATEGORY_COLOURS[name] || '#C9BDB6';

/**
 * Which part of the face the board is asking for, as bars that reorder as
 * they move. Small enough to sit beside the target rather than run the width
 * of the page.
 */
export const CategorySquare: React.FC<CategorySquareProps> = ({
  categories,
  activeCategoryFilter,
  onSelectCategory
}) => (
  <div className="glass-card rounded-[24px] p-4 text-left font-montserrat h-full flex flex-col">
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-500 block">
          Popularity
        </span>
        <h3 className="text-base font-display font-black text-stone-900 tracking-tight leading-tight mt-0.5">
          What is wanted where
        </h3>
      </div>
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

    <div className="mt-4 space-y-2.5 grow flex flex-col justify-center">
      {categories.slice(0, 5).map((stat) => {
        const isSelected = activeCategoryFilter === stat.name;
        return (
          <motion.button
            key={stat.name}
            layout
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            type="button"
            onClick={() => onSelectCategory(isSelected ? null : stat.name)}
            className={`w-full text-left cursor-pointer rounded-xl px-2 py-1.5 transition-colors ${
              isSelected ? 'bg-white/80' : 'hover:bg-white/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-stone-700 flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: colourFor(stat.name) }}
                />
                <span className="truncate">{stat.name}</span>
              </span>
              <span className="text-[10px] font-black text-stone-900 tabular-nums shrink-0">
                {stat.percentage}%
              </span>
            </div>
            <span className="mt-1 block h-1.5 rounded-full bg-white/70 overflow-hidden">
              <motion.span
                className="block h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${colourFor(stat.name)}55, ${colourFor(stat.name)})`
                }}
                initial={false}
                animate={{ width: `${stat.percentage}%` }}
                transition={{ type: 'spring', stiffness: 110, damping: 20 }}
              />
            </span>
          </motion.button>
        );
      })}
    </div>
  </div>
);
