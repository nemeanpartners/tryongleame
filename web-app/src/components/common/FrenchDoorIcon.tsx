import React from 'react';

interface FrenchDoorIconProps {
  isOpen?: boolean;
  className?: string;
  size?: number;
  strokeColor?: string;
}

export const FrenchDoorIcon: React.FC<FrenchDoorIconProps> = ({
  isOpen = false,
  className = 'w-6 h-6',
  size = 24,
  strokeColor = 'currentColor'
}) => {
  if (isOpen) {
    // Apple SF Symbol: door.french.open (matching the reference image 3 exactly)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Outer Door Frame Arch / Header */}
        <path d="M4 21V5.5C4 4.12 5.12 3 6.5 3H17.5C18.88 3 20 4.12 20 5.5V21" />

        {/* Left French Door Swung Open */}
        <path d="M6.5 5.5L10 6.8V18.5L6.5 19.5V5.5Z" strokeWidth="1.6" />
        <line x1="6.5" y1="10" x2="10" y2="10.8" strokeWidth="1.3" />
        <line x1="6.5" y1="14.5" x2="10" y2="15" strokeWidth="1.3" />

        {/* Right French Door Swung Open */}
        <path d="M17.5 5.5L14 6.8V18.5L17.5 19.5V5.5Z" strokeWidth="1.6" />
        <line x1="17.5" y1="10" x2="14" y2="10.8" strokeWidth="1.3" />
        <line x1="17.5" y1="14.5" x2="14" y2="15" strokeWidth="1.3" />
      </svg>
    );
  }

  // Apple SF Symbol: door.french.closed (matching the reference image 2 exactly)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer Door Frame Arch / Header */}
      <path d="M4 21V5.5C4 4.12 5.12 3 6.5 3H17.5C18.88 3 20 4.12 20 5.5V21" />

      {/* Left Door Panel with 3 Window Panes */}
      <rect x="6" y="5.5" width="5.2" height="14.5" rx="0.5" strokeWidth="1.5" />
      <line x1="6" y1="10.5" x2="11.2" y2="10.5" strokeWidth="1.4" />
      <line x1="6" y1="15.2" x2="11.2" y2="15.2" strokeWidth="1.4" />

      {/* Right Door Panel with 3 Window Panes */}
      <rect x="12.8" y="5.5" width="5.2" height="14.5" rx="0.5" strokeWidth="1.5" />
      <line x1="12.8" y1="10.5" x2="18" y2="10.5" strokeWidth="1.4" />
      <line x1="12.8" y1="15.2" x2="18" y2="15.2" strokeWidth="1.4" />
    </svg>
  );
};
