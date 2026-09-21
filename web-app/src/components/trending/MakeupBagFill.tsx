import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

/** One thing people have asked for, sitting in the bag. */
export interface BagItem {
  id: string;
  name: string;
  /** Which product it is, which decides the object shown. */
  product: string;
  colour: string;
}

interface MakeupBagFillProps {
  totalVotes: number;
  votesToday: number;
  /** The most wanted looks, in order. Each one is an object in the pouch. */
  items: BagItem[];
  /** Runs the drop; false settles everything where it lands. */
  play: boolean;
  /** A look that has just been voted for, which falls in on its own. */
  incoming?: BagItem | null;
  onFinished?: () => void;
}

/* -------------------------------------------------------------------------
   THE POUCH
   Soft vinyl rather than a box: the sides bow out, the corners are pillowy,
   and the bottom has a gusset it can stand on. Everything below is in the
   pouch's own coordinates.
   ------------------------------------------------------------------------- */
const BAG_W = 252;
const BAG_H = 172;
const LIP = 34; // where the zip sits
const FLOOR = BAG_H - 20;

/** The outline of the pouch, bowed out at the sides the way vinyl gives. */
const POUCH = `
  M 26 ${LIP + 6}
  Q 18 ${BAG_H / 2} 24 ${FLOOR - 16}
  Q 26 ${FLOOR} 48 ${FLOOR}
  L ${BAG_W - 48} ${FLOOR}
  Q ${BAG_W - 26} ${FLOOR} ${BAG_W - 24} ${FLOOR - 16}
  Q ${BAG_W - 18} ${BAG_H / 2} ${BAG_W - 26} ${LIP + 6}
  Q ${BAG_W / 2} ${LIP - 2} 26 ${LIP + 6}
  Z
`;

/** How many things fit before the pouch is full. */
const CAPACITY = 6;

/** The object shown for each product. */
const ART_FOR: Record<string, string> = {
  Lipstick: '/products/lipstick.png',
  'Lip gloss': '/products/gloss.png',
  'Lip liner': '/products/lipliner.png',
  Eyeliner: '/products/eyeliner.png',
  Eyeshadow: '/products/eyeshadow.png',
  Mascara: '/products/mascara.png',
  Blush: '/products/blush.png',
  Bronzer: '/products/bronzer.png'
};

/** How tall each one stands. Tubes are tall, pans are flat. */
const HEIGHT_FOR: Record<string, number> = {
  Lipstick: 52,
  'Lip gloss': 52,
  'Lip liner': 50,
  Eyeliner: 50,
  Eyeshadow: 30,
  Mascara: 54,
  Blush: 34,
  Bronzer: 35
};

const artFor = (item: BagItem) => ART_FOR[item.product] || ART_FOR.Lipstick;
const heightFor = (item: BagItem) => HEIGHT_FOR[item.product] || 40;

/**
 * Where each thing lies in the pouch. Not a grid: they lean, they sit at
 * different depths, and they overlap, the way things do when they have been
 * dropped in rather than arranged.
 */
const PLACES = [
  { x: 74, lift: 0, tilt: -9, depth: 1 },
  { x: 118, lift: 4, tilt: 6, depth: 0.9 },
  { x: 160, lift: 1, tilt: -4, depth: 1 },
  { x: 96, lift: 14, tilt: 12, depth: 0.82 },
  { x: 186, lift: 9, tilt: -13, depth: 0.86 },
  { x: 52, lift: 11, tilt: 8, depth: 0.84 }
];

/**
 * What the community is asking for, as a pouch filling up.
 *
 * Every object in it is a look someone has voted for, so the bag is the board
 * in physical form: vote for a brown liner and a brown liner is what is in the
 * bag. It fills when the app is opened, and anything voted for afterwards
 * drops in on its own.
 */
export const MakeupBagFill: React.FC<MakeupBagFillProps> = ({
  totalVotes,
  votesToday,
  items,
  play,
  incoming,
  onFinished
}) => {
  const [dropped, setDropped] = useState(!play);
  const bagRef = useRef<HTMLDivElement | null>(null);
  const [bagRect, setBagRect] = useState<DOMRect | null>(null);

  /** What is in the pouch: the most wanted, plus anything just voted for. */
  const contents = useMemo(() => {
    const top = items.slice(0, CAPACITY);
    if (!incoming) return top;
    const without = top.filter((item) => item.id !== incoming.id);
    return [incoming, ...without].slice(0, CAPACITY);
  }, [items, incoming]);

  const placeOf = (index: number) => {
    const place = PLACES[index % PLACES.length];
    return {
      left: place.x,
      top: FLOOR - heightFor(contents[index]) * place.depth - place.lift,
      tilt: place.tilt,
      depth: place.depth
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
    }, 2400);

    return () => {
      window.clearTimeout(done);
      document.body.style.overflow = previousOverflow;
    };
  }, [play]);

  const falling = play && !dropped && bagRect !== null;

  const renderItem = (item: BagItem, index: number) => {
    const place = placeOf(index);
    return (
      <img
        src={artFor(item)}
        alt=""
        title={item.name}
        draggable={false}
        style={{ height: heightFor(item) * place.depth }}
        className="w-auto object-contain drop-shadow-[0_3px_4px_rgba(70,52,46,0.3)]"
      />
    );
  };

  return (
    <div className="relative w-full flex items-end justify-center" style={{ height: 232 }}>
      {/* The surface it stands on */}
      <div
        className="absolute inset-x-2 bottom-0 rounded-[28px]"
        style={{
          top: 8,
          background: 'linear-gradient(180deg, #fefdfc 0%, #f6f2ef 62%, #ece5e0 100%)'
        }}
      />

      <div ref={bagRef} className="relative" style={{ width: BAG_W, height: BAG_H + 26 }}>
        {/* Contact shadow, soft and close */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-[50%] pointer-events-none"
          style={{
            bottom: 14,
            width: BAG_W - 76,
            height: 14,
            background: 'radial-gradient(ellipse, rgba(74,54,46,0.26) 0%, rgba(74,54,46,0) 72%)'
          }}
        />

        {/* The back of the pouch, seen through the front */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0"
        >
          <defs>
            <linearGradient id="vinylBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#e8e2de" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d={POUCH} fill="url(#vinylBack)" />
        </svg>

        {/* What is in it */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: dropped ? 1 : 0 }}
          transition={{ duration: 0.01 }}
        >
          {contents.map((item, index) => {
            const place = placeOf(index);
            // Something just voted for falls in rather than appearing.
            const isNew = incoming?.id === item.id && dropped;
            return (
              <motion.div
                key={item.id}
                className="absolute flex items-end justify-center"
                style={{
                  left: place.left,
                  top: place.top,
                  transformOrigin: 'bottom center'
                }}
                initial={
                  isNew
                    ? { x: '-50%', y: -150, opacity: 0, rotate: place.tilt * 3 }
                    : { x: '-50%', y: 0, opacity: 1, rotate: place.tilt }
                }
                animate={{ x: '-50%', y: 0, opacity: 1, rotate: place.tilt }}
                transition={{ type: 'spring', stiffness: 140, damping: 15 }}
              >
                {renderItem(item, index)}
              </motion.div>
            );
          })}
        </motion.div>

        {/* The clear front, which is what puts them inside it */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="vinylFront" x1="0.08" y1="0" x2="0.92" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.44" />
              <stop offset="22%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="84%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.38" />
            </linearGradient>
            <linearGradient id="zipTape" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fdfcfb" />
              <stop offset="40%" stopColor="#e4ddd8" />
              <stop offset="100%" stopColor="#c3b8b1" />
            </linearGradient>
            <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#d7d2ce" />
              <stop offset="60%" stopColor="#a9a29d" />
              <stop offset="100%" stopColor="#efecea" />
            </linearGradient>
          </defs>

          {/* The vinyl itself */}
          <path d={POUCH} fill="url(#vinylFront)" />
          {/* Its thickness: a bright inner edge just inside the outline */}
          <path d={POUCH} fill="none" stroke="#ffffff" strokeWidth="2.6" opacity="0.72" />
          <path d={POUCH} fill="none" stroke="rgba(120,102,94,0.34)" strokeWidth="1" />

          {/* The gusset: the side and bottom the pouch stands on */}
          <path
            d={`M ${BAG_W - 52} ${LIP + 8} Q ${BAG_W - 36} ${BAG_H / 2} ${BAG_W - 50} ${FLOOR - 4}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            opacity="0.5"
          />
          <path
            d={`M 46 ${FLOOR - 12} Q ${BAG_W / 2} ${FLOOR - 3} ${BAG_W - 46} ${FLOOR - 12}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            opacity="0.55"
          />

          {/* Folds, where soft vinyl creases */}
          <path
            d={`M 42 ${LIP + 22} Q 52 ${BAG_H / 2} 44 ${FLOOR - 22}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d={`M ${BAG_W - 68} ${LIP + 30} Q ${BAG_W - 58} ${BAG_H / 2 + 10} ${BAG_W - 66} ${FLOOR - 26}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.28"
          />
          {/* A long highlight down the face */}
          <path
            d={`M 62 ${LIP + 14} L 84 ${FLOOR - 30}`}
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.22"
          />

          {/* The zip: a tape with teeth and two small pulls */}
          <path
            d={`M 26 ${LIP} Q ${BAG_W / 2} ${LIP - 8} ${BAG_W - 26} ${LIP}`}
            fill="none"
            stroke="url(#zipTape)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d={`M 32 ${LIP - 0.5} Q ${BAG_W / 2} ${LIP - 8.5} ${BAG_W - 32} ${LIP - 0.5}`}
            fill="none"
            stroke="#8d8078"
            strokeWidth="1.4"
            strokeDasharray="1 2.2"
            opacity="0.8"
          />
          <g>
            {/* Two small polished pulls, sitting together */}
            <rect x={BAG_W / 2 - 10} y={LIP - 9} width="8" height="7" rx="1.6" fill="url(#silver)" />
            <rect x={BAG_W / 2 + 2} y={LIP - 9} width="8" height="7" rx="1.6" fill="url(#silver)" />
            <path
              d={`M ${BAG_W / 2 - 8} ${LIP - 9} v-5 a2.6 2.6 0 0 1 5.2 0 v5`}
              fill="none"
              stroke="url(#silver)"
              strokeWidth="1.8"
            />
            <path
              d={`M ${BAG_W / 2 + 4} ${LIP - 9} v-5 a2.6 2.6 0 0 1 5.2 0 v5`}
              fill="none"
              stroke="url(#silver)"
              strokeWidth="1.8"
            />
          </g>
        </svg>

        {/* Its reflection on the surface */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: -2,
            width: BAG_W - 70,
            height: 24,
            background:
              'linear-gradient(180deg, rgba(206,196,190,0.42) 0%, rgba(206,196,190,0) 100%)',
            filter: 'blur(4px)',
            borderRadius: '0 0 30px 30px'
          }}
        />

        {/* What is in the bag, counted */}
        <motion.div
          className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
          style={{ top: -6 }}
          initial={play ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: dropped ? 1 : 0, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span
            className="px-2.5 py-1 rounded-full flex items-baseline gap-1.5"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(90,70,62,0.12)'
            }}
          >
            <span className="text-[13px] font-display font-black text-stone-900 tabular-nums leading-none">
              {totalVotes.toLocaleString()}
            </span>
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-stone-400">
              votes in the bag
            </span>
          </span>
          {votesToday > 0 && (
            <span className="mt-1 text-[9px] font-bold text-[#E91E63] tabular-nums">
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
            {contents.map((item, index) => {
              const place = placeOf(index);
              const targetX = bagRect.left + place.left;
              const targetY = bagRect.top + place.top;
              return (
                <motion.div
                  key={item.id}
                  className="absolute flex items-end justify-center"
                  style={{
                    left: targetX,
                    top: targetY,
                    transformOrigin: 'bottom center'
                  }}
                  initial={{
                    x: '-50%',
                    y: -(targetY + 90),
                    opacity: 0,
                    rotate: place.tilt * 4
                  }}
                  animate={{ x: '-50%', y: 0, opacity: 1, rotate: place.tilt }}
                  transition={{
                    type: 'spring',
                    stiffness: 130,
                    damping: 14,
                    delay: index * 0.09
                  }}
                >
                  {renderItem(item, index)}
                </motion.div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
