import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play } from 'lucide-react';
import { db, collection, getDocs } from '../../firebase';
import { KissPrint, PrintStyle } from '../trending/SignatureShadeWall';
import { openLookInNative } from '../../lib/nativeLooks';

type PostedLip = {
  id: string;
  name: string;
  hex: string;
  creator: string;
  printStyle?: PrintStyle;
};

/** What the board shows before anyone has posted to it. */
const SEED: PostedLip[] = [
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

/**
 * The Signature Lips board: every shade someone has claimed as theirs, as a
 * wall of kiss prints.
 *
 * Closed it is a pattern, which is the point - it reads as wallpaper until you
 * open it, and then every print has a name, a shade and the person who wears
 * it, and can be worn straight from there.
 */
export const SignatureLipsBoard: React.FC = () => {
  const [posted, setPosted] = useState<PostedLip[]>(SEED);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, 'signature_lips'));
        if (cancelled || snapshot.empty) return;
        const live = snapshot.docs.map((entry) => entry.data() as PostedLip);
        // What people actually posted first, then the seed to fill the wall.
        setPosted([...live, ...SEED].slice(0, 48));
      } catch (error) {
        console.warn('Signature lips board is showing its seed:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const wallpaper = useMemo(() => posted.slice(0, 15), [posted]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full glass-card rounded-[28px] p-5 sm:p-6 text-left cursor-pointer active:scale-[0.99] transition-transform overflow-hidden relative"
      >
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
              Signature Lips
            </span>
            <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
              The wall of kisses
            </h3>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              {posted.length} shades people are known for. Tap to read the wall.
            </p>
          </div>
        </div>

        {/* Closed, it is a pattern */}
        <div className="mt-4 grid grid-cols-5 gap-1 -rotate-3 scale-105">
          {wallpaper.map((lip, index) => (
            <KissPrint
              key={`${lip.id}-${index}`}
              hex={lip.hex}
              style={lip.printStyle}
              width={62}
              className={index % 2 ? 'translate-y-1.5' : ''}
            />
          ))}
        </div>
      </button>

      {/* Opened, every print has a name on it */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="glass-sheet rounded-[28px] w-full max-w-lg max-h-[86vh] overflow-y-auto p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
                    Signature Lips
                  </span>
                  <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight">
                    The wall of kisses
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/80 border border-white flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {posted.map((lip, index) => (
                  <button
                    key={`${lip.id}-${index}`}
                    type="button"
                    onClick={() =>
                      openLookInNative({ id: lip.id, name: lip.name, lipColor: lip.hex })
                    }
                    className="flex flex-col items-center gap-1 rounded-2xl py-2 hover:bg-white/60 cursor-pointer active:scale-95 transition-all"
                  >
                    <KissPrint hex={lip.hex} style={lip.printStyle} width={66} />
                    <span className="text-[10px] font-black text-stone-900 leading-tight text-center px-1">
                      {lip.name}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400 leading-none">
                      @{lip.creator}
                    </span>
                    <span className="text-[8.5px] font-bold text-stone-400 tabular-nums flex items-center gap-1">
                      {lip.hex.toUpperCase()}
                      <Play className="w-2 h-2 fill-current text-[#E91E63]" />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
