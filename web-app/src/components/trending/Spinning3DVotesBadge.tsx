import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Heart, Flame } from 'lucide-react';

interface Spinning3DVotesBadgeProps {
  totalVotes: number;
  todayCount?: number;
  boostTrigger?: number; // increments when user votes to accelerate 3D spin
  onClick?: () => void;
}

export const Spinning3DVotesBadge: React.FC<Spinning3DVotesBadgeProps> = ({
  totalVotes,
  todayCount = 18,
  boostTrigger = 0,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger rapid celebratory 3D spin when a vote occurs
  useEffect(() => {
    if (boostTrigger > 0) {
      setIsBoosted(true);
      const timer = setTimeout(() => {
        setIsBoosted(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [boostTrigger]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30; // max +/- 15 deg tilt
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -30;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    setIsBoosted(true);
    setTimeout(() => setIsBoosted(false), 1800);
    if (onClick) onClick();
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title="Click or hover to interact with the 3D Community Votes Emblem"
      className="relative bg-gradient-to-br from-[#faf6f5] via-[#fcf8f6] to-[#f4ebe6] hover:from-[#fdf8f6] hover:to-[#efe3dc] rounded-2xl p-3.5 sm:p-4 border border-[#bc8381]/25 hover:border-[#732729]/40 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md group overflow-visible select-none"
    >
      {/* Background ambient lighting aura */}
      <div 
        className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#bc8381]/20 via-[#f43f5e]/20 to-[#fbbf24]/25 blur-sm -z-10 transition-opacity duration-500 pointer-events-none ${
          isBoosted ? 'opacity-100 animate-pulse' : isHovered ? 'opacity-70' : 'opacity-0'
        }`} 
      />

      {/* Top Header Row with 3D Coin preview and Label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase block">
          Total Votes
        </span>
        
        {/* Interactive 3D Spinning Coin/Badge Anchor */}
        <div 
          className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0"
          style={{ perspective: '600px' }}
        >
          {/* 3D Rotating Container */}
          <div 
            className="w-full h-full relative transition-transform"
            style={{
              transformStyle: 'preserve-3d',
              animation: isBoosted 
                ? 'spin3dFast 0.9s cubic-bezier(0.2, 0.8, 0.3, 1) infinite'
                : isHovered 
                ? 'spin3dMedium 2.4s linear infinite' 
                : 'spin3dSmooth 7s linear infinite',
              transform: `rotateX(${mouseOffset.y}deg) rotateZ(${mouseOffset.x * 0.3}deg)`
            }}
          >
            {/* FRONT FACE OF 3D BADGE */}
            <div 
              className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                background: 'radial-gradient(circle at 35% 30%, #fff7ed 0%, #fde68a 25%, #f59e0b 60%, #b45309 100%)',
                border: '1.5px solid #fef08a',
                boxShadow: '0 4px 10px rgba(180, 83, 9, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.9)'
              }}
            >
              {/* Inner coin rim ridge */}
              <div className="w-[82%] h-[82%] rounded-full border border-amber-300/80 flex items-center justify-center bg-gradient-to-tr from-amber-600/20 to-yellow-200/40 relative overflow-hidden">
                {/* Specular shimmer light sweep */}
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/70 to-transparent transform -rotate-45 animate-[shimmer3d_3s_infinite]" />
                
                {/* Center 3D Star / Sparkle Icon */}
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950 fill-amber-300 drop-shadow-xs" />
              </div>
            </div>

            {/* BACK FACE OF 3D BADGE (180deg flip) */}
            <div 
              className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg"
              style={{
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                background: 'radial-gradient(circle at 35% 30%, #fff1f2 0%, #fda4af 30%, #f43f5e 70%, #9f1239 100%)',
                border: '1.5px solid #ffe4e6',
                boxShadow: '0 4px 10px rgba(159, 18, 57, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.9)'
              }}
            >
              <div className="w-[82%] h-[82%] rounded-full border border-rose-200/80 flex items-center justify-center bg-gradient-to-tr from-rose-900/20 to-pink-200/40 relative overflow-hidden">
                <Heart className="w-3.5 h-3.5 text-rose-950 fill-rose-100 drop-shadow-xs" />
              </div>
            </div>

            {/* 3D Depth / Rim Edge Layers */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none opacity-40"
              style={{
                transform: 'translateZ(-1px)',
                background: '#78350f',
                boxShadow: '0 0 2px rgba(0,0,0,0.5)'
              }} 
            />
            <div 
              className="absolute inset-0 rounded-full pointer-events-none opacity-40"
              style={{
                transform: 'translateZ(-2px)',
                background: '#451a03',
                boxShadow: '0 0 4px rgba(0,0,0,0.6)'
              }} 
            />
          </div>

          {/* Sparkle burst particles on boost */}
          {isBoosted && (
            <div className="absolute -top-1 -right-1 text-xs animate-ping pointer-events-none">
              ✨
            </div>
          )}
        </div>
      </div>

      {/* Main Total Votes Number & Dynamic Increment Pulse */}
      <div className="flex items-baseline gap-1.5 mt-2">
        <span 
          className={`text-2xl sm:text-3xl font-black text-stone-900 leading-none tracking-tight transition-transform duration-300 font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] ${
            isBoosted ? 'scale-110 text-[#732729]' : ''
          }`}
        >
          {totalVotes.toLocaleString()}
        </span>
        <span className="text-[11px] font-semibold text-[#bc8381] whitespace-nowrap flex items-center gap-0.5">
          <Flame className="w-3 h-3 text-[#f43f5e] fill-current" />
          <span>+{todayCount} today</span>
        </span>
      </div>

      {/* Interactive Micro Tooltip Indicator */}
      <div className="mt-1 text-[9px] text-stone-400 font-medium flex items-center justify-between">
        <span className="group-hover:text-[#732729] transition-colors">
          {isHovered ? '★ 3D Interactive Coin' : 'Tap to interact'}
        </span>
        {isBoosted && (
          <span className="text-emerald-600 font-bold animate-pulse text-[9.5px]">
            +1 Confetti Active!
          </span>
        )}
      </div>

      {/* Keyframe Injection for 3D spin */}
      <style>{`
        @keyframes spin3dSmooth {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        @keyframes spin3dMedium {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        @keyframes spin3dFast {
          0% {
            transform: rotateY(0deg) scale(1.15);
          }
          100% {
            transform: rotateY(720deg) scale(1);
          }
        }
        @keyframes shimmer3d {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(200%) rotate(45deg);
          }
        }
      `}</style>
    </div>
  );
};
