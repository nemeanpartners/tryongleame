import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RotateCw } from 'lucide-react';
import { CURATED_20_LOOKS } from '../../data/curatedLooksData';
import { openLookInNative } from '../../lib/nativeLooks';
import { PresetLook } from '../../types';

interface CapsuleMachineProps {
  onBack: () => void;
  /** Used in a browser, where there is no native try-on to hand off to. */
  onLoadPreset?: (preset: PresetLook) => void;
}

type Prize = {
  id: string;
  name: string;
  tagline: string;
  lip: string;
  blush: string;
  eye: string;
  image?: string;
};

/** A capsule in the globe: where it sits, how big, what colour. */
type Ball = { x: number; y: number; r: number; hue: string; clear: boolean };

/**
 * Deterministic packing, so the globe looks the same every time it is opened
 * rather than reshuffling under the viewer.
 */
const packBalls = (prizes: Prize[]): Ball[] => {
  const balls: Ball[] = [];
  const rows = [
    { y: 74, count: 7, r: 7.2 },
    { y: 62, count: 6, r: 7.6 },
    { y: 50, count: 7, r: 7 },
    { y: 39, count: 6, r: 6.6 },
    { y: 29, count: 5, r: 6.2 }
  ];
  let index = 0;
  rows.forEach((row, rowIndex) => {
    for (let i = 0; i < row.count; i++) {
      const spread = 100 / (row.count + 1);
      const jitter = (((index * 37) % 10) - 5) * 0.4;
      balls.push({
        x: spread * (i + 1) + jitter,
        y: row.y + (((index * 23) % 6) - 3) * 0.3,
        r: row.r,
        hue: prizes[index % prizes.length].lip,
        // A few clear ones, the way a real globe has them
        clear: (rowIndex + i) % 5 === 0
      });
      index += 1;
    }
  });
  return balls;
};

/**
 * The capsule machine: turn the handle, a capsule drops, it opens, and what is
 * inside is a look you can wear.
 *
 * The wheel on the home page picks for you and tells you what you got. This
 * one you have to work: the knob turns, the capsule falls and rocks to a stop,
 * and it does not open until it has landed.
 */
export const CapsuleMachine: React.FC<CapsuleMachineProps> = ({ onBack, onLoadPreset }) => {
  const prizes: Prize[] = useMemo(
    () =>
      CURATED_20_LOOKS.map((look) => ({
        id: look.id,
        name: look.name,
        tagline: look.tagline,
        lip: look.config.lipColor,
        blush: look.config.blushColor,
        eye: look.config.eyeshadowColor,
        image: look.image
      })),
    []
  );

  const balls = useMemo(() => packBalls(prizes), [prizes]);

  const [turns, setTurns] = useState(0);
  const [stage, setStage] = useState<'idle' | 'dropping' | 'open'>('idle');
  const [prize, setPrize] = useState<Prize | null>(null);

  const turn = () => {
    if (stage === 'dropping') return;
    const next = prizes[Math.floor(Math.random() * prizes.length)];
    setPrize(next);
    setTurns((count) => count + 1);
    setStage('dropping');
    // It opens once it has landed, not while it is still falling.
    window.setTimeout(() => setStage('open'), 1250);
  };

  const wear = () => {
    if (!prize) return;
    const handled = openLookInNative({
      id: prize.id,
      name: prize.name,
      lipColor: prize.lip,
      blushColor: prize.blush,
      eyeshadowColor: prize.eye,
      returnTo: '/capsule'
    });
    if (!handled && onLoadPreset) {
      const look = CURATED_20_LOOKS.find((entry) => entry.id === prize.id);
      if (look) {
        onLoadPreset({
          id: look.id,
          name: look.name,
          description: look.tagline,
          eyeshadowColor: look.config.eyeshadowColor,
          eyeshadowOpacity: look.config.eyeshadowOpacity,
          eyelinerColor: look.config.eyelinerColor,
          eyelinerOpacity: look.config.eyelinerOpacity,
          eyelinerStyle: look.config.eyelinerStyle,
          blushColor: look.config.blushColor,
          blushOpacity: look.config.blushOpacity,
          lipColor: look.config.lipColor,
          lipOpacity: look.config.lipOpacity,
          lipGloss: look.config.lipGloss,
          lashesStyle: look.config.lashesStyle,
          glitterLevel: look.config.glitterLevel,
          filter: 'none'
        });
      }
    }
  };

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
            The Shade Machine
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-stone-900 tracking-tight">
            Turn for a look
          </h1>
        </div>
      </div>

      <div className="glass-card rounded-[28px] p-5 sm:p-7 flex flex-col items-center">
        {/* ------------------------------------------------ the machine */}
        <div className="relative w-full" style={{ maxWidth: 340 }}>
          {/* Body */}
          <div
            className="relative rounded-[26px] overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #fbdde6 0%, #f4b9cb 46%, #e79bb1 100%)',
              boxShadow:
                '0 26px 50px rgba(120,70,88,0.22), inset 0 2px 0 rgba(255,255,255,0.7), inset -8px 0 22px rgba(160,96,118,0.22)'
            }}
          >
            {/* Crown with the name on it */}
            <div className="pt-5 pb-3 text-center">
              <span
                className="text-[15px] font-black tracking-[0.42em] text-white/95"
                style={{ textShadow: '0 1px 2px rgba(150,86,108,0.45)' }}
              >
                GLEAME
              </span>
            </div>

            {/* The glass globe */}
            <div className="px-5">
              <div
                className="relative rounded-[18px] overflow-hidden"
                style={{
                  aspectRatio: '1 / 0.92',
                  background:
                    'linear-gradient(180deg, #ffffff 0%, #fdeef3 40%, #f7dbe5 100%)',
                  boxShadow:
                    'inset 0 10px 22px rgba(170,110,132,0.28), inset 0 -6px 14px rgba(255,255,255,0.85)'
                }}
              >
                {/* The funnel the capsules sit in */}
                <svg viewBox="0 0 100 92" className="absolute inset-0 w-full h-full">
                  <path d="M0 0 H100 V10 L58 44 V92 H42 V44 L0 10 Z" fill="#ffffff" opacity="0.55" />
                </svg>

                {/* The capsules */}
                {balls.map((ball, index) => (
                  <motion.span
                    key={index}
                    className="absolute rounded-full"
                    style={{
                      left: `${ball.x}%`,
                      top: `${ball.y}%`,
                      width: `${ball.r * 2}%`,
                      height: `${ball.r * 2.18}%`,
                      transform: 'translate(-50%, -50%)',
                      background: ball.clear
                        ? 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.5) 46%, rgba(226,200,210,0.6) 100%)'
                        : `radial-gradient(circle at 32% 26%, #ffffff 0%, ${ball.hue}cc 38%, ${ball.hue} 100%)`,
                      boxShadow:
                        'inset 0 -4px 8px rgba(120,70,88,0.25), 0 2px 5px rgba(120,70,88,0.2)'
                    }}
                    animate={{ y: [0, -1.5, 0] }}
                    transition={{
                      duration: 3 + (index % 5) * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: (index % 7) * 0.2
                    }}
                  />
                ))}

                {/* The light on the glass */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(118deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.12) 26%, rgba(255,255,255,0) 52%)'
                  }}
                />
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '10%',
                    top: '8%',
                    width: '26%',
                    height: '16%',
                    background:
                      'radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
                    transform: 'rotate(-22deg)'
                  }}
                />
              </div>
            </div>

            {/* The front panel: knob, coin slot, chute */}
            <div className="px-5 pt-5 pb-6">
              <div className="flex items-center gap-4">
                {/* Knob */}
                <button
                  type="button"
                  onClick={turn}
                  disabled={stage === 'dropping'}
                  title="Turn"
                  className="relative shrink-0 cursor-pointer active:scale-95 transition-transform disabled:cursor-default"
                  style={{ width: 62, height: 62 }}
                >
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'conic-gradient(from 210deg, #ffffff, #d9cdc7 25%, #9c8b84 48%, #f4efec 68%, #b5a49c 88%, #ffffff)',
                      boxShadow:
                        '0 4px 10px rgba(120,70,88,0.35), inset 0 2px 3px rgba(255,255,255,0.9)'
                    }}
                    animate={{ rotate: turns * 180 }}
                    transition={{ type: 'spring', stiffness: 90, damping: 14 }}
                  >
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: 8,
                        height: 34,
                        background: 'linear-gradient(180deg, #8d7d76, #e8e1dd)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)'
                      }}
                    />
                  </motion.span>
                </button>

                {/* Coin slot and light */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#e0577f] shadow-inner" />
                  <span className="w-3 h-7 rounded-full bg-[#e0577f]/80 shadow-inner" />
                </div>

                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 ml-auto text-right leading-tight">
                  {stage === 'dropping' ? 'Dispensing' : 'Turn the knob'}
                </span>
              </div>

              {/* Chute */}
              <div
                className="relative mt-4 mx-auto rounded-t-[26px] rounded-b-[8px] overflow-hidden"
                style={{
                  width: '58%',
                  height: 86,
                  background: 'linear-gradient(180deg, #c76d8b 0%, #a44f6d 100%)',
                  boxShadow: 'inset 0 10px 18px rgba(90,40,58,0.5)'
                }}
              >
                {/* What fell out of it */}
                <AnimatePresence>
                  {stage !== 'idle' && prize && (
                    <motion.span
                      key={turns}
                      className="absolute left-1/2 rounded-full"
                      style={{
                        width: 46,
                        height: 50,
                        marginLeft: -23,
                        background: `radial-gradient(circle at 32% 26%, #ffffff 0%, ${prize.lip}cc 38%, ${prize.lip} 100%)`,
                        boxShadow: 'inset 0 -5px 10px rgba(120,70,88,0.3), 0 4px 8px rgba(70,30,46,0.45)'
                      }}
                      initial={{ top: -60, opacity: 0 }}
                      animate={{ top: [-60, 34, 26, 32], opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, times: [0, 0.6, 0.8, 1], ease: 'easeIn' }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Feet */}
          <div className="mx-auto h-3 rounded-b-2xl" style={{ width: '86%', background: '#d78fa6' }} />
          <div
            className="mx-auto mt-2 rounded-[50%]"
            style={{
              width: '70%',
              height: 14,
              background: 'radial-gradient(ellipse, rgba(120,70,88,0.28) 0%, rgba(120,70,88,0) 70%)'
            }}
          />
        </div>

        {/* ------------------------------------------------ what you got */}
        <div className="w-full mt-5" style={{ maxWidth: 340 }}>
          <AnimatePresence mode="wait">
            {stage === 'open' && prize ? (
              <motion.div
                key={`prize-${turns}`}
                initial={{ opacity: 0, y: 14, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="neu-inset p-4"
              >
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                  You got
                </span>
                <h2 className="text-xl font-display font-black text-stone-900 tracking-tight leading-tight mt-0.5">
                  {prize.name}
                </h2>
                <p className="text-[11px] text-stone-500 font-medium mt-1 line-clamp-2">
                  {prize.tagline}
                </p>

                <div className="flex items-center gap-1.5 mt-2.5">
                  {[prize.eye, prize.blush, prize.lip].map((hex, index) => (
                    <span
                      key={index}
                      className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <span className="text-[9.5px] font-bold text-stone-400 ml-1 tabular-nums">
                    {prize.lip.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={wear}
                    className="grow py-2.5 rounded-full bg-[#E91E63] text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Try it on
                  </button>
                  <button
                    type="button"
                    onClick={turn}
                    className="px-4 py-2.5 rounded-full neu-pill text-[11px] font-black uppercase tracking-wider text-[#2A1715] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <RotateCw className="w-3 h-3" />
                    Again
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-bold text-stone-400 text-center"
              >
                {stage === 'dropping'
                  ? 'Here it comes…'
                  : `${prizes.length} looks in the machine. Turn the knob.`}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
