import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

export interface BagCategory {
  name: string;
  percentage: number;
}

interface MakeupBagFillProps {
  totalVotes: number;
  votesToday: number;
  categories: BagCategory[];
  /** Runs the drop; false settles everything where it lands. */
  play: boolean;
  onFinished?: () => void;
}

/* -------------------------------------------------------------------------
   HOW FULL THE BAG GETS
   One product per hundred votes. A quiet board still shows a few pieces, and
   a busy one fills the bag without ever spilling out of it: the slots below
   are a hard limit, so the count can never exceed the room there is for it.
   ------------------------------------------------------------------------- */
const VOTES_PER_PRODUCT = 100;
const MIN_PRODUCTS = 6;

const BAG_W = 248;
const BAG_H = 168;
/** The inside of the pouch, in bag coordinates. */
const INNER_LEFT = 30;
const INNER_RIGHT = BAG_W - 30;
const INNER_BOTTOM = BAG_H - 18;
const INNER_TOP = 52;
const SLOT_W = 30;
const SLOT_H = 40;
const COLUMNS = Math.floor((INNER_RIGHT - INNER_LEFT) / SLOT_W);
const ROWS = Math.floor((INNER_BOTTOM - INNER_TOP) / SLOT_H);
const CAPACITY = COLUMNS * ROWS;

/** The photographs, cut out and sitting in /public/products. */
const PRODUCT_ART = {
  lipstick: '/products/lipstick.png',
  gloss: '/products/gloss.png',
  lipliner: '/products/lipliner.png',
  blush: '/products/blush.png',
  bronzer: '/products/bronzer.png',
  mascara: '/products/mascara.png',
  eyeliner: '/products/eyeliner.png',
  eyeshadow: '/products/eyeshadow.png'
} as const;

type ProductKind = keyof typeof PRODUCT_ART;

/** How tall each one stands in the bag. Tubes are tall, pans are flat. */
const PRODUCT_HEIGHT: Record<ProductKind, number> = {
  lipstick: 38,
  gloss: 38,
  lipliner: 36,
  blush: 24,
  bronzer: 25,
  mascara: 40,
  eyeliner: 36,
  eyeshadow: 20
};

/** What each line in the tally puts in the bag. */
const KINDS_FOR: Record<string, ProductKind[]> = {
  Lipstick: ['lipstick'],
  'Lip gloss': ['gloss'],
  'Lip liner': ['lipliner'],
  Eyeliner: ['eyeliner'],
  Eyeshadow: ['eyeshadow'],
  Mascara: ['mascara'],
  Blush: ['blush'],
  Bronzer: ['bronzer'],
  // The older, broader names, in case anything still sends them.
  Lips: ['lipstick', 'gloss', 'lipliner'],
  Eyes: ['mascara', 'eyeshadow', 'eyeliner'],
  Highlight: ['bronzer'],
  'Full Face': ['eyeshadow', 'bronzer'],
  Other: ['lipliner', 'gloss']
};

/** Repeatable jitter, so the jumble is the same every time it is drawn. */
const wobble = (index: number, spread: number, salt = 1) =>
  (((index * 37 + salt * 11) % 100) / 100 - 0.5) * 2 * spread;

/**
 * What the community is asking for, as a clear pouch filling up.
 *
 * A ring and a row of percentages say the same thing, but you have to read
 * them. Here every product that drops in is a hundred votes, and which
 * products they are is the category mix - so a bag of lipsticks means lips are
 * winning. It plays when the app is opened, then settles.
 */
export const MakeupBagFill: React.FC<MakeupBagFillProps> = ({
  totalVotes,
  votesToday,
  categories,
  play,
  onFinished
}) => {
  const [dropped, setDropped] = useState(!play);
  const bagRef = useRef<HTMLDivElement | null>(null);
  const [bagRect, setBagRect] = useState<DOMRect | null>(null);

  // Hand out the products in proportion to the vote, largest share first.
  const products = useMemo(() => {
    const wanted = Math.min(
      CAPACITY,
      Math.max(MIN_PRODUCTS, Math.round(totalVotes / VOTES_PER_PRODUCT))
    );
    const ranked = [...categories]
      .filter((category) => category.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);

    const pool = ranked.length > 0 ? ranked : [{ name: 'Other', percentage: 100 }];
    const out: { kind: ProductKind; index: number }[] = [];

    pool.forEach((category) => {
      const kinds = KINDS_FOR[category.name] || KINDS_FOR.Other;
      const count = Math.max(1, Math.round((category.percentage / 100) * wanted));
      for (let i = 0; i < count && out.length < wanted; i++) {
        out.push({ kind: kinds[i % kinds.length], index: out.length });
      }
    });
    return out.slice(0, wanted);
  }, [categories, totalVotes]);

  /** Where each product ends up: a slot in the bag, filled from the floor up,
      nudged so the pile looks tipped in rather than lined up. */
  const slotFor = (index: number) => {
    const row = Math.floor(index / COLUMNS);
    const column = index % COLUMNS;
    const inRow = Math.min(COLUMNS, products.length - row * COLUMNS);
    const rowWidth = inRow * SLOT_W;
    const left = INNER_LEFT + (INNER_RIGHT - INNER_LEFT - rowWidth) / 2 + column * SLOT_W;
    return {
      x: left + wobble(index, 3),
      y: INNER_BOTTOM - (row + 1) * SLOT_H + wobble(index, 2, 3),
      // Tipped either way, the way things land when they are dropped in.
      tilt: wobble(index, 26, 7)
    };
  };

  useLayoutEffect(() => {
    if (!play || !bagRef.current) return;
    setBagRect(bagRef.current.getBoundingClientRect());
  }, [play]);

  // Held in a ref: the card above re-renders every second to tick its clock,
  // and depending on the callback itself would restart the drop each time -
  // leaving the page scroll-locked and the drop never finishing.
  const finishRef = useRef(onFinished);
  finishRef.current = onFinished;

  useEffect(() => {
    if (!play) return;

    // The drop is the point, so the page holds still until it has landed.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const done = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow;
      setDropped(true);
      finishRef.current?.();
    }, 2600);

    return () => {
      window.clearTimeout(done);
      document.body.style.overflow = previousOverflow;
    };
  }, [play]);

  const falling = play && !dropped && bagRect !== null;

  const renderProduct = (product: { kind: ProductKind; index: number }) => (
    <img
      src={PRODUCT_ART[product.kind]}
      alt=""
      draggable={false}
      style={{ height: PRODUCT_HEIGHT[product.kind], width: 'auto' }}
      className="object-contain drop-shadow-[0_2px_3px_rgba(60,44,38,0.25)]"
    />
  );

  return (
    <div className="relative w-full flex items-end justify-center" style={{ height: 224 }}>
      {/* The studio surface it stands on */}
      <div
        className="absolute inset-x-2 bottom-0 rounded-[28px]"
        style={{
          top: 6,
          background:
            'linear-gradient(180deg, #fdfcfb 0%, #f2eeeb 58%, #e4dcd6 78%, #efe9e5 100%)'
        }}
      />

      <div ref={bagRef} className="relative" style={{ width: BAG_W, height: BAG_H + 22 }}>
        {/* Contact shadow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-[50%] pointer-events-none"
          style={{
            bottom: 8,
            width: BAG_W - 54,
            height: 18,
            background: 'radial-gradient(ellipse, rgba(74,54,46,0.30) 0%, rgba(74,54,46,0) 72%)'
          }}
        />

        {/* The back wall of the pouch, seen through the front */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0"
        >
          <defs>
            <linearGradient id="vinylBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
              <stop offset="62%" stopColor="#f3eeea" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d9cec7" stopOpacity="0.62" />
            </linearGradient>
          </defs>
          <rect x="22" y="34" width={BAG_W - 44} height={BAG_H - 48} rx="14" fill="url(#vinylBack)" />
          {/* The seam where the back panel meets the base */}
          <rect x="30" y={BAG_H - 26} width={BAG_W - 60} height="5" rx="2.5" fill="#cbbdb4" opacity="0.5" />
        </svg>

        {/* The products, once they have landed */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: dropped ? 1 : 0 }}
          transition={{ duration: 0.01 }}
        >
          {products.map((product) => {
            const slot = slotFor(product.index);
            return (
              <div
                key={product.index}
                className="absolute flex items-end justify-center"
                style={{
                  left: slot.x,
                  top: slot.y,
                  width: SLOT_W,
                  height: SLOT_H,
                  transform: `rotate(${slot.tilt}deg)`
                }}
              >
                {renderProduct(product)}
              </div>
            );
          })}
        </motion.div>

        {/* The clear front: what makes them look like they are inside it */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="vinylFront" x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
              <stop offset="18%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="82%" stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="zipMetal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fdfbf9" />
              <stop offset="34%" stopColor="#d5cac1" />
              <stop offset="62%" stopColor="#a1928a" />
              <stop offset="100%" stopColor="#efe8e2" />
            </linearGradient>
            <linearGradient id="topFace" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Front panel */}
          <rect
            x="22"
            y="34"
            width={BAG_W - 44}
            height={BAG_H - 48}
            rx="14"
            fill="url(#vinylFront)"
            stroke="rgba(112,94,86,0.5)"
            strokeWidth="1.5"
          />
          {/* The bright edge the vinyl catches on its left and base */}
          <path
            d={`M23 48 V${BAG_H - 28} Q23 ${BAG_H - 15} 36 ${BAG_H - 15} H${BAG_W - 36}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.8"
          />
          {/* The base, where the vinyl doubles over and goes darker */}
          <path
            d={`M24 ${BAG_H - 40} H${BAG_W - 24} V${BAG_H - 16} Q${BAG_W - 24} ${BAG_H - 14} ${BAG_W - 36} ${BAG_H - 14} H36 Q24 ${BAG_H - 14} 24 ${BAG_H - 16} Z`}
            fill="rgba(120,100,92,0.13)"
          />
          <path
            d={`M34 ${BAG_H - 21} H${BAG_W - 34}`}
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Long specular streaks */}
          <path
            d={`M48 48 L62 ${BAG_H - 40}`}
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d={`M${BAG_W - 58} 52 L${BAG_W - 50} ${BAG_H - 50}`}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.22"
          />

          {/* The zip: tape, teeth and two pulls */}
          <rect x="20" y="28" width={BAG_W - 40} height="12" rx="6" fill="url(#zipMetal)" />
          <line
            x1="28"
            y1="34"
            x2={BAG_W - 28}
            y2="34"
            stroke="#6f625a"
            strokeWidth="1.6"
            strokeDasharray="1.4 2.4"
            opacity="0.85"
          />
          <g>
            <rect x={BAG_W / 2 - 15} y="22" width="13" height="12" rx="2.5" fill="url(#zipMetal)" stroke="#9b8d84" strokeWidth="0.6" />
            <rect x={BAG_W / 2 + 2} y="22" width="13" height="12" rx="2.5" fill="url(#zipMetal)" stroke="#9b8d84" strokeWidth="0.6" />
            <path
              d={`M${BAG_W / 2 - 11} 23 v-8 a4.5 4.5 0 0 1 9 0 v8`}
              fill="none"
              stroke="url(#zipMetal)"
              strokeWidth="3"
            />
            <path
              d={`M${BAG_W / 2 + 6} 23 v-8 a4.5 4.5 0 0 1 9 0 v8`}
              fill="none"
              stroke="url(#zipMetal)"
              strokeWidth="3"
            />
          </g>
        </svg>

        {/* The reflection it casts on the surface */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: -6,
            width: BAG_W - 60,
            height: 22,
            background: 'linear-gradient(180deg, rgba(210,198,190,0.5) 0%, rgba(210,198,190,0) 100%)',
            filter: 'blur(3px)',
            borderRadius: '0 0 16px 16px'
          }}
        />

        {/* The count, once everything has landed */}
        <motion.div
          className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
          style={{ top: -12 }}
          initial={play ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: dropped ? 1 : 0, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="px-3 py-1 rounded-full bg-white/92 border border-white shadow-xs flex items-baseline gap-1.5">
            <span className="text-base font-display font-black text-stone-900 tabular-nums leading-none">
              {totalVotes.toLocaleString()}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
              votes in the bag
            </span>
          </span>
          {votesToday > 0 && (
            <span className="mt-1 text-[9.5px] font-bold text-[#E91E63] tabular-nums">
              +{votesToday} dropped in today
            </span>
          )}
        </motion.div>
      </div>

      {/* The drop itself, from the top of the screen.
          Rendered to the body because the card it sits in clips its own
          contents - inside it, the products would appear out of thin air at
          the card's edge instead of falling into view. */}
      {falling &&
        createPortal(
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 70 }}>
            {products.map((product) => {
              const slot = slotFor(product.index);
              const targetX = bagRect.left + slot.x;
              const targetY = bagRect.top + slot.y;
              return (
                <motion.div
                  key={product.index}
                  className="absolute flex items-end justify-center"
                  style={{ left: targetX, top: targetY, width: SLOT_W, height: SLOT_H }}
                  initial={{
                    y: -(targetY + SLOT_H + 80),
                    opacity: 0,
                    rotate: slot.tilt * 4
                  }}
                  animate={{ y: 0, opacity: 1, rotate: slot.tilt }}
                  transition={{
                    type: 'spring',
                    stiffness: 130,
                    damping: 14,
                    delay: product.index * 0.08
                  }}
                >
                  {renderProduct(product)}
                </motion.div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
