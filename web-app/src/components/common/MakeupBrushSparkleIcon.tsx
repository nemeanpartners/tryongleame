import React from 'react';

interface MakeupBrushSparkleIconProps {
  className?: string;
  size?: number;
  strokeColor?: string;
}

export const MakeupBrushSparkleIcon: React.FC<MakeupBrushSparkleIconProps> = ({
  className = 'w-6 h-6',
  size = 26,
  strokeColor = 'currentColor'
}) => {
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 1. Long Slanted Brush Handle */}
      <path d="M6 30 C4.5 28.5 5 25.5 7 23.5 L17 13.5 L22.5 19 L12.5 29 C10.5 31 7.5 31.5 6 30 Z" />

      {/* 2. Metal Ferrule Ring Bands */}
      <line x1="15" y1="15.5" x2="20.5" y2="21" strokeWidth="2.2" />
      <line x1="17" y1="13.5" x2="22.5" y2="19" strokeWidth="2.2" />

      {/* 3. Fluffy Makeup Brush Bristle Head */}
      <path d="M19 11.5 C20 9 23 4.5 28 5 C31.5 5.5 33 8.5 32.5 12 C32 16.5 27.5 19.5 24.5 20" strokeWidth="2.2" />
      {/* Bristle inner contour textures */}
      <line x1="21.5" y1="11" x2="25.5" y2="7.5" strokeWidth="1.8" />
      <line x1="24.5" y1="14" x2="28.5" y2="10.5" strokeWidth="1.8" />

      {/* 4. Top Left 4-Point Concave Sparkle Star */}
      <path d="M8 3 C8 5.2 9.8 7 12 7 C9.8 7 8 8.8 8 11 C8 8.8 6.2 7 4 7 C6.2 7 8 5.2 8 3 Z" strokeWidth="1.9" />

      {/* 5. Left Middle 4-Point Concave Sparkle Star */}
      <path d="M5 13 C5 14.8 6.5 16.2 8.2 16.2 C6.5 16.2 5 17.6 5 19.4 C5 17.6 3.5 16.2 1.8 16.2 C3.5 16.2 5 14.8 5 13 Z" strokeWidth="1.9" />

      {/* 6. Bottom Right 4-Point Concave Sparkle Star */}
      <path d="M30 23 C30 25.2 31.8 27 34 27 C31.8 27 30 28.8 30 31 C30 28.8 28.2 27 26 27 C28.2 27 30 25.2 30 23 Z" strokeWidth="1.9" />
    </svg>
  );
};
