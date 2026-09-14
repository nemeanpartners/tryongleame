import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PopularChallengeCardProps {
  onEnter: () => void;
  className?: string;
}

export const PopularChallengeCard: React.FC<PopularChallengeCardProps> = ({
  onEnter,
  className = ''
}) => {
  return (
    <div 
      onClick={onEnter}
      className={`relative rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#f4efea] border border-[#e5ddd5] p-5 sm:p-7 md:p-8 shadow-[0_4px_24px_rgba(140,122,107,0.06)] hover:shadow-md transition-all cursor-pointer text-left ${className}`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
        {/* Left Column: Minimalist Typography & Action */}
        <div className="flex-1 flex flex-col justify-between self-stretch space-y-4 sm:space-y-6">
          <div className="space-y-3">
            <span className="block text-[11px] sm:text-xs font-semibold text-[#8c7a6b] uppercase tracking-[0.2em]">
              AUGUST CHALLENGE
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#1c1917] tracking-tight leading-[1.08]">
              Clean<br />Summer
            </h3>
            <p className="text-xs sm:text-sm text-[#8c7a6b] font-normal pt-0.5">
              1.2K joined &middot; Ends Aug 31
            </p>
          </div>

          <div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEnter();
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-black hover:bg-stone-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>ENTER NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Warm Sculptural Shadow Minimalist Photo */}
        <div className="w-full md:w-60 lg:w-72 h-48 sm:h-56 md:h-64 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#ebe4dd] shrink-0 border border-[#dfd6cd] shadow-xs">
          <img 
            src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=800"
            alt="Clean Summer Challenge"
            className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

