import React from 'react';

interface AppleWandSparklesIconProps {
  className?: string;
  size?: number;
  strokeColor?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * Apple SF Symbol: wand.and.sparkles (wand.and.sparkle)
 * Exact recreation of Apple's SF Symbol with the angled wand (tip & handle separated by optical gap)
 * and three 4-pointed organic concave sparkle stars.
 */
export const AppleWandSparklesIcon: React.FC<AppleWandSparklesIconProps> = ({
  className = 'w-6 h-6',
  size = 24,
  strokeColor,
  color,
  strokeWidth = 2.6
}) => {
  const activeColor = strokeColor || color || 'currentColor';

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 1. Wand Tip (Top-Left) */}
      <path
        d="M5.5 5.5 L8.5 8.5"
        stroke={activeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Wand Handle / Shaft (Diagonal from center to bottom-right) */}
      <path
        d="M11.5 11.5 L19.2 19.2"
        stroke={activeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Top-Right Primary Sparkle (Large 4-Point Concave Star) */}
      <path
        d="M 18.5 1.5 Q 18.5 5.5 22.5 5.5 Q 18.5 5.5 18.5 9.5 Q 18.5 5.5 14.5 5.5 Q 18.5 5.5 18.5 1.5 Z"
        fill={activeColor}
      />

      {/* 4. Left Secondary Sparkle (Medium 4-Point Concave Star) */}
      <path
        d="M 4.5 9.5 Q 4.5 12.5 7.5 12.5 Q 4.5 12.5 4.5 15.5 Q 4.5 12.5 1.5 12.5 Q 4.5 12.5 4.5 9.5 Z"
        fill={activeColor}
      />

      {/* 5. Bottom-Left Tertiary Sparkle (Small 4-Point Concave Star) */}
      <path
        d="M 9.5 16.5 Q 9.5 18.5 11.5 18.5 Q 9.5 18.5 9.5 20.5 Q 9.5 18.5 7.5 18.5 Q 9.5 18.5 9.5 16.5 Z"
        fill={activeColor}
      />
    </svg>
  );
};

export default AppleWandSparklesIcon;
