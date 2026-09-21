import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play } from 'lucide-react';
import { db, collection, getDocs } from '../../firebase';
import { KissPrint, PrintStyle } from '../trending/SignatureShadeWall';
import { openLookInNative } from '../../lib/nativeLooks';

export type PostedLip = {
  id: string;
  name: string;
  hex: string;
  creator: string;
  printStyle?: PrintStyle;
};

/** What the wall shows before anyone has posted to it. */
export const SEED_LIPS: PostedLip[] = [
  { id: 'seed_1', name: 'Ruby Woo', hex: '#C3172B', creator: 'glam.artist' },
  { id: 'seed_2', name: 'Pillow Talk', hex: '#C08272', creator: 'softglow' },
  { id: 'seed_3', name: 'Diva', hex: '#7B1F2B', creator: 'nightshift' },
  { id: 'seed_4', name: 'Velvet Teddy', hex: '#A9736B', creator: 'cleanbeauty' },
  { id: 'seed_5', name: 'Raspberry Jelly', hex: '#B94A63', creator: 'berrybabe' },
  { id: 'seed_6', name: 'Rouge 999', hex: '#C4162A', creator: 'redroom' },
  { id: 'seed_7', name: 'Whirl', hex: '#9A6A63', creator: 'ninetiesgirl' },
  { id: 'seed_8', name: 'Chili', hex: '#A8402F', creator: 'warmtones' },
  { id: 'seed_9', name: 'PB&J', hex: '#B4736B', creator: 'everyday' },
  { id: 'seed_10', name: 'Soar', hex: '#A97C79', creator: 'linerfirst' },
  { id: 'seed_11', name: 'Mehr', hex: '#B4707A', creator: 'mauvemood' },
  { id: 'seed_12', name: 'Bronx Baby', hex: '#B76A72', creator: 'mariofan' }
];

/** Everything posted to the board, newest first, with the seed behind it. */
export const useSignatureLips = () => {
  const [lips, setLips] = useState<PostedLip[]>(SEED_LIPS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, 'signature_lips'));
        if (cancelled || snapshot.empty) return;
        const live = snapshot.docs.map((entry) => entry.data() as PostedLip);
        setLips([...live, ...SEED_LIPS].slice(0, 60));
      } catch (error) {
        console.warn('Signature lips board is showing its seed:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return lips;
};

/**
 * The wall of kisses, as a page of its own.
 *
 * Every print is a shade someone claimed. Each one carries its name, its hex
 * and the person who wears it, and can be worn straight from here.
 */
export const SignatureLipsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const lips = useSignatureLips();

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-left">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full neu-pill flex items-center justify-center cursor-pointer shrink-0"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700 stroke-[2.5]" />
        </button>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
            Signature Lips
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-stone-900 tracking-tight">
            The wall of kisses
          </h1>
        </div>
      </div>

      <p className="text-xs text-stone-500 font-medium">
        {lips.length} shades people are known for. Tap one to wear it.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {lips.map((lip, index) => (
          <motion.button
            key={`${lip.id}-${index}`}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.5) }}
            onClick={() =>
              openLookInNative({
                id: lip.id,
                name: lip.name,
                lipColor: lip.hex,
                returnTo: '/signature-lips'
              })
            }
            className="glass-card rounded-3xl p-4 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <KissPrint hex={lip.hex} style={lip.printStyle} width={110} />
            <span className="text-xs font-black text-stone-900 text-center leading-tight">
              {lip.name}
            </span>
            <span className="text-[10px] font-bold text-stone-400">@{lip.creator}</span>
            <span className="text-[10px] font-bold text-stone-500 tabular-nums flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: lip.hex }}
              />
              {lip.hex.toUpperCase()}
              <Play className="w-2.5 h-2.5 fill-current text-[#E91E63]" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
