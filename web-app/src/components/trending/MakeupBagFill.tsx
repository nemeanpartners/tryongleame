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
   a busy one fills the bag without ever spilling out of it: the grid below is
   a hard limit, so the count can never exceed the room there is for it.
   ------------------------------------------------------------------------- */
const VOTES_PER_PRODUCT = 100;
const MIN_PRODUCTS = 6;

const BAG_W = 232;
const BAG_H = 176;
/** The inside of the pouch, in bag coordinates. */
const INNER_LEFT = 26;
const INNER_RIGHT = BAG_W - 26;
const INNER_BOTTOM = BAG_H - 16;
const INNER_TOP = 54;
const SLOT_W = 36;
const SLOT_H = 38;
const COLUMNS = Math.floor((INNER_RIGHT - INNER_LEFT) / SLOT_W);
const ROWS = Math.floor((INNER_BOTTOM - INNER_TOP) / SLOT_H);
const CAPACITY = COLUMNS * ROWS;

type ProductKind = 'lipstick' | 'compact' | 'gloss' | 'mascara' | 'pencil';

/* -------------------------------------------------------------------------
   PRODUCT ARTWORK
   Put a PNG path in here and that product is drawn from the photo instead of
   the vector below - nothing else has to change.
   ------------------------------------------------------------------------- */
const PRODUCT_ART: Partial<Record<ProductKind, string>> = {};

/** Which product stands for each category. */
const KIND_FOR: Record<string, ProductKind> = {
  Lips: 'lipstick',
  Blush: 'compact',
  Eyes: 'mascara',
  Highlight: 'gloss',
  'Full Face': 'compact',
  Other: 'pencil'
};

const COLOUR_FOR: Record<string, string> = {
  Lips: '#D81B60',
  Blush: '#C08A7C',
  Eyes: '#2A1715',
  Highlight: '#D8A7B1',
  'Full Face': '#7A5C52',
  Other: '#9C8B82'
};

/** A darker version of a hex colour, for the shaded side of a product. */
const shade = (hex: string, amount = 0.72) => {
  const value = hex.replace('#', '');
  const r = Math.round(parseInt(value.slice(0, 2), 16) * amount);
  const g = Math.round(parseInt(value.slice(2, 4), 16) * amount);
  const b = Math.round(parseInt(value.slice(4, 6), 16) * amount);
  return `rgb(${r},${g},${b})`;
};

/**
 * One product. Drawn with a lit side, a shaded side and a specular highlight,
 * so it reads as an object on a shelf rather than as an icon.
 */
const Product: React.FC<{ kind: ProductKind; colour: string; id: string }> = ({
  kind,
  colour,
  id
}) => {
  const art = PRODUCT_ART[kind];
  if (art) {
    return <img src={art} alt="" className="w-full h-full object-contain" draggable={false} />;
  }

  const dark = shade(colour);
  const gradientId = `grad-${kind}-${id}`;
  const metalId = `metal-${id}`;

  const Metal = () => (
    <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#c9bcb2" />
      <stop offset="28%" stopColor="#f6f1ec" />
      <stop offset="55%" stopColor="#d8ccc2" />
      <stop offset="100%" stopColor="#a8988c" />
    </linearGradient>
  );

  const Body = () => (
    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={dark} />
      <stop offset="30%" stopColor={colour} />
      <stop offset="58%" stopColor={colour} />
      <stop offset="100%" stopColor={dark} />
    </linearGradient>
  );

  switch (kind) {
    case 'lipstick':
      return (
        <svg viewBox="0 0 30 46" className="w-full h-full overflow-visible">
          <defs><Body /><Metal /></defs>
          <ellipse cx="15" cy="44" rx="10" ry="2.2" fill="#000" opacity="0.13" />
          <rect x="8" y="16" width="14" height="28" rx="2.4" fill={`url(#${gradientId})`} />
          <rect x="8" y="16" width="14" height="5" rx="2" fill={`url(#${metalId})`} />
          <rect x="7.4" y="3" width="15.2" height="14" rx="2.6" fill={`url(#${metalId})`} />
          <rect x="10.5" y="20" width="2.4" height="19" rx="1.2" fill="#fff" opacity="0.4" />
          <rect x="10" y="6" width="2" height="8" rx="1" fill="#fff" opacity="0.55" />
        </svg>
      );
    case 'compact':
      return (
        <svg viewBox="0 0 34 34" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id={gradientId} cx="0.36" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="42%" stopColor={colour} />
              <stop offset="100%" stopColor={dark} />
            </radialGradient>
            <Metal />
          </defs>
          <ellipse cx="17" cy="32" rx="12" ry="2.2" fill="#000" opacity="0.13" />
          <circle cx="17" cy="17" r="14.5" fill={`url(#${metalId})`} />
          <circle cx="17" cy="17" r="12" fill={`url(#${gradientId})`} />
          <ellipse cx="12.5" cy="11.5" rx="4.4" ry="2.8" fill="#fff" opacity="0.5" />
          <path d="M17 2.5a14.5 14.5 0 0 1 14.2 11.8" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.5" />
        </svg>
      );
    case 'gloss':
      return (
        <svg viewBox="0 0 26 46" className="w-full h-full overflow-visible">
          <defs><Body /><Metal /></defs>
          <ellipse cx="13" cy="44" rx="9" ry="2.2" fill="#000" opacity="0.13" />
          <rect x="5" y="14" width="16" height="30" rx="5.5" fill={`url(#${gradientId})`} opacity="0.92" />
          <rect x="5" y="14" width="16" height="30" rx="5.5" fill="none" stroke="#fff" strokeWidth="0.9" opacity="0.65" />
          <rect x="9" y="2" width="8" height="13" rx="2.2" fill={`url(#${metalId})`} />
          <rect x="7.6" y="19" width="3" height="18" rx="1.5" fill="#fff" opacity="0.55" />
          <ellipse cx="13" cy="40" rx="6" ry="2.6" fill="#fff" opacity="0.25" />
        </svg>
      );
    case 'mascara':
      return (
        <svg viewBox="0 0 24 48" className="w-full h-full overflow-visible">
          <defs><Body /><Metal /></defs>
          <ellipse cx="12" cy="46" rx="8" ry="2.2" fill="#000" opacity="0.13" />
          <rect x="6" y="14" width="12" height="32" rx="3" fill={`url(#${gradientId})`} />
          <rect x="5.4" y="2" width="13.2" height="13" rx="2.4" fill={`url(#${metalId})`} />
          <rect x="6" y="14" width="12" height="2.6" fill="#fff" opacity="0.3" />
          <rect x="8.4" y="19" width="2.2" height="21" rx="1.1" fill="#fff" opacity="0.38" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 18 48" className="w-full h-full overflow-visible">
          <defs><Body /></defs>
          <ellipse cx="9" cy="46" rx="6" ry="2" fill="#000" opacity="0.13" />
          <rect x="4" y="10" width="10" height="36" rx="2" fill={`url(#${gradientId})`} />
          <path d="M4 10 9 1l5 9z" fill="#e8ded6" />
          <path d="M7 5 9 1l2 4z" fill={colour} />
          <rect x="5.8" y="15" width="2" height="24" rx="1" fill="#fff" opacity="0.35" />
        </svg>
      );
  }
};

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

    if (ranked.length === 0) {
      return Array.from({ length: MIN_PRODUCTS }, (_, index) => ({
        kind: 'compact' as ProductKind,
        colour: '#C9BDB6',
        name: 'Other',
        index
      }));
    }

    const out: { kind: ProductKind; colour: string; name: string; index: number }[] = [];
    ranked.forEach((category) => {
      const count = Math.max(1, Math.round((category.percentage / 100) * wanted));
      for (let i = 0; i < count && out.length < wanted; i++) {
        out.push({
          kind: KIND_FOR[category.name] || 'pencil',
          colour: COLOUR_FOR[category.name] || '#C9BDB6',
          name: category.name,
          index: out.length
        });
      }
    });
    return out.slice(0, wanted);
  }, [categories, totalVotes]);

  /** Where each product ends up: a slot in the bag, filled from the floor up. */
  const slotFor = (index: number) => {
    const row = Math.floor(index / COLUMNS);
    const column = index % COLUMNS;
    // Centre a short row rather than leaving a gap at one end.
    const inRow = Math.min(COLUMNS, products.length - row * COLUMNS);
    const rowWidth = inRow * SLOT_W;
    const left = INNER_LEFT + (INNER_RIGHT - INNER_LEFT - rowWidth) / 2 + column * SLOT_W;
    return { x: left, y: INNER_BOTTOM - (row + 1) * SLOT_H };
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

  const pouchPath = `M18 40 Q18 30 30 30 H${BAG_W - 30} Q${BAG_W - 18} 30 ${BAG_W - 18} 40
     V${BAG_H - 26} Q${BAG_W - 18} ${BAG_H - 12} ${BAG_W - 32} ${BAG_H - 12}
     H32 Q18 ${BAG_H - 12} 18 ${BAG_H - 26} Z`;

  return (
    <div className="relative w-full flex items-end justify-center" style={{ height: 224 }}>
      {/* The surface it sits on */}
      <div
        className="absolute inset-x-2 bottom-0 rounded-[28px]"
        style={{
          top: 10,
          background: 'linear-gradient(168deg, #fbf8f6 0%, #efe7e2 46%, #ddd0c9 100%)'
        }}
      />
      <div
        className="absolute rounded-[50%] pointer-events-none"
        style={{
          bottom: 16,
          width: BAG_W - 40,
          height: 16,
          background: 'radial-gradient(ellipse, rgba(90,66,56,0.22) 0%, rgba(90,66,56,0) 70%)'
        }}
      />

      <div ref={bagRef} className="relative" style={{ width: BAG_W, height: BAG_H + 18 }}>
        {/* Inside of the pouch */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0"
        >
          <defs>
            <linearGradient id="vinylBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#e9dfd9" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path d={pouchPath} fill="url(#vinylBack)" />
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
            const tilt = ((product.index * 47) % 26) - 13;
            return (
              <div
                key={product.index}
                className="absolute flex items-end justify-center"
                style={{
                  left: slot.x,
                  top: slot.y,
                  width: SLOT_W,
                  height: SLOT_H,
                  transform: `rotate(${tilt * 0.4}deg)`
                }}
              >
                <Product kind={product.kind} colour={product.colour} id={`b${product.index}`} />
              </div>
            );
          })}
        </motion.div>

        {/* The clear vinyl front, which is what puts them inside it */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="vinylFront" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="38%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="62%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.42" />
            </linearGradient>
            <linearGradient id="zipMetal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7f3ef" />
              <stop offset="45%" stopColor="#cfc3ba" />
              <stop offset="100%" stopColor="#a4958a" />
            </linearGradient>
          </defs>

          <path d={pouchPath} fill="url(#vinylFront)" stroke="rgba(120,100,92,0.38)" strokeWidth="1.5" />
          <path
            d={pouchPath}
            fill="none"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="1"
            transform="translate(0,1.4)"
          />
          {/* The vinyl gathers and darkens where it meets the base */}
          <path
            d={`M24 ${BAG_H - 40} H${BAG_W - 24} V${BAG_H - 14} H24 Z`}
            fill="rgba(120,100,92,0.10)"
          />
          {/* Side seams */}
          <path d={`M30 32 V${BAG_H - 14}`} stroke="#ffffff" strokeWidth="1.1" opacity="0.55" />
          <path
            d={`M${BAG_W - 30} 32 V${BAG_H - 14}`}
            stroke="#ffffff"
            strokeWidth="1.1"
            opacity="0.55"
          />
          {/* A long soft reflection down the vinyl */}
          <path
            d={`M44 44 L60 ${BAG_H - 26}`}
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* The zip along the top, with its pulls */}
          <rect x="16" y="24" width={BAG_W - 32} height="11" rx="5.5" fill="url(#zipMetal)" />
          <line
            x1="24"
            y1="29.5"
            x2={BAG_W - 24}
            y2="29.5"
            stroke="#8d7d72"
            strokeWidth="1.2"
            strokeDasharray="1.6 2.6"
            opacity="0.8"
          />
          <g>
            <rect x={BAG_W / 2 - 13} y="20" width="11" height="9" rx="2" fill="url(#zipMetal)" />
            <rect x={BAG_W / 2 + 2} y="20" width="11" height="9" rx="2" fill="url(#zipMetal)" />
            <path
              d={`M${BAG_W / 2 - 9} 20 v-7 a3.5 3.5 0 0 1 7 0 v7`}
              fill="none"
              stroke="url(#zipMetal)"
              strokeWidth="2.6"
            />
            <path
              d={`M${BAG_W / 2 + 6} 20 v-7 a3.5 3.5 0 0 1 7 0 v7`}
              fill="none"
              stroke="url(#zipMetal)"
              strokeWidth="2.6"
            />
          </g>
        </svg>

        {/* The count, once everything has landed */}
        <motion.div
          className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
          style={{ top: -10 }}
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
              const tilt = ((product.index * 47) % 26) - 13;
              return (
                <motion.div
                  key={product.index}
                  className="absolute flex items-end justify-center"
                  style={{ left: targetX, top: targetY, width: SLOT_W, height: SLOT_H }}
                  initial={{ y: -(targetY + SLOT_H + 60), opacity: 0, rotate: tilt * 3 }}
                  animate={{ y: 0, opacity: 1, rotate: tilt * 0.4 }}
                  transition={{
                    type: 'spring',
                    stiffness: 130,
                    damping: 14,
                    delay: product.index * 0.08
                  }}
                >
                  <Product kind={product.kind} colour={product.colour} id={`f${product.index}`} />
                </motion.div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
