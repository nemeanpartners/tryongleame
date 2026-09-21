import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useSignatureLips } from './SignatureLipsPage';

/**
 * The cover of the wall: lipsticks arranged as a pair of lips.
 *
 * Closed it is a picture worth looking at; tapping it opens the wall itself,
 * where every print has a name and someone behind it.
 */
export const SignatureLipsBoard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const lips = useSignatureLips();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full glass-card rounded-[28px] p-5 sm:p-6 text-left cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
            Signature Lips
          </span>
          <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
            The wall of kisses
          </h3>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            {lips.length} shades people are known for
          </p>
        </div>
        <span className="w-9 h-9 rounded-full bg-white/80 border border-white flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-4 h-4 text-stone-600" />
        </span>
      </div>

      <img
        src="/lips/cover.png"
        alt="Lipsticks arranged as a pair of lips"
        className="w-full max-w-[420px] mx-auto mt-3 object-contain"
        draggable={false}
      />
    </button>
  );
};
