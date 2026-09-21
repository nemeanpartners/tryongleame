import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, RotateCw, Heart, X, Layers, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PresetLook } from '../../types';

export interface WheelLookItem {
  id: string;
  name: string;
  iconType: 'sun' | 'heart' | 'coffee' | 'sparkles' | 'lips' | 'moon' | 'butterfly' | 'cherries';
  emoji: string;
  subtitle: string;
  vibe: string;
  description: string;
  // Precise visual styling to match the reference image
  bgGradient: string;
  textColor: string;
  subtextColor: string;
  iconColor: string;
  borderColor: string;
  boxShadow: string;
  tiltAngle: number; // pill orientation angle (degrees)
  orientation: 'vertical' | 'horizontal' | 'diagonal';
  preset: PresetLook;
  tags: string[];
}

export const WHEEL_LOOKS: WheelLookItem[] = [
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    iconType: 'sun',
    emoji: '☀️',
    subtitle: 'WARM • SUNLIT GLOW',
    vibe: 'Sunlit Apricot Sheen',
    description: 'Golden hour sunshine glow, warmed apricot flush & radiant glazed lips.',
    bgGradient: '#f1e7df',
    textColor: '#382327',
    subtextColor: '#704850',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'vertical',
    tags: ['Sunlit', 'Apricot Glow', 'Radiant'],
    preset: {
      id: 'wheel_golden_hour',
      name: 'Golden Hour',
      description: 'Golden hour sunshine glow, warmed apricot flush & radiant glazed lips',
      eyeshadowColor: '#fed7aa',
      eyeshadowOpacity: 0.65,
      blushColor: '#fb923c',
      blushOpacity: 0.45,
      lipColor: '#ea580c',
      lipOpacity: 0.8,
      lipGloss: true,
      lashesStyle: 'natural',
      glitterLevel: 30,
      filter: 'warm-glow',
    }
  },
  {
    id: 'espresso_glaze',
    name: 'Espresso Glaze',
    iconType: 'coffee',
    emoji: '☕',
    subtitle: 'WARM • CAFE BRONZE',
    vibe: 'Roasted Mocha Radiance',
    description: 'Rich cocoa eye contour, terracotta sculpted draping, and a high-shine caramel mocha pout.',
    bgGradient: '#e8d7cf',
    textColor: '#382327',
    subtextColor: '#704850',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'diagonal',
    tags: ['Bronze', 'Glossy', 'Trending'],
    preset: {
      id: 'wheel_espresso_glaze',
      name: 'Espresso Glaze',
      description: 'Roasted cocoa lids, terracotta sculpted contour & satin mocha lip glaze',
      eyeshadowColor: '#451a03',
      eyeshadowOpacity: 0.8,
      eyelinerColor: '#291003',
      eyelinerOpacity: 0.95,
      eyelinerStyle: 'cat-eye',
      blushColor: '#9a3412',
      blushOpacity: 0.45,
      lipColor: '#78350f',
      lipOpacity: 0.9,
      lipGloss: true,
      lashesStyle: 'glam',
      glitterLevel: 30,
      filter: 'warm-glow',
    }
  },
  {
    id: 'siren_eye',
    name: 'Siren Eye',
    iconType: 'moon',
    emoji: '🌙',
    subtitle: 'SMOKY • DRAMATIC',
    vibe: 'Feline Smudged Kohl',
    description: 'Elongated smoked feline cat-eye wing, diffused smudged shadow, and contour 90s nude lips.',
    bgGradient: '#ddd8d4',
    textColor: '#2E2628',
    subtextColor: '#5E5255',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'horizontal',
    tags: ['Feline Wing', 'Onyx', 'Dramatic'],
    preset: {
      id: 'wheel_siren_eye',
      name: 'Siren Eye',
      description: 'Dramatic feline lifted liner, smudged onyx shadow & 90s contour nude lips',
      eyeshadowColor: '#27272a',
      eyeshadowOpacity: 0.85,
      eyelinerColor: '#000000',
      eyelinerOpacity: 1,
      eyelinerStyle: 'cat-eye',
      blushColor: '#a8a29e',
      blushOpacity: 0.4,
      lipColor: '#a16207',
      lipOpacity: 0.8,
      lipGloss: false,
      lashesStyle: 'glam',
      glitterLevel: 20,
      filter: 'vintage',
    }
  },
  {
    id: 'soft_glam',
    name: 'Soft Glam',
    iconType: 'heart',
    emoji: '♡',
    subtitle: 'POLISHED • TIMELESS',
    vibe: 'Refined Rosy Velvet',
    description: 'Seamless diffused neutral shadows, refined kitten lash extensions, and a satin mauve pout.',
    bgGradient: '#e8ccc5',
    textColor: '#382327',
    subtextColor: '#704850',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'diagonal',
    tags: ['Timeless', 'Velvet', 'Classy'],
    preset: {
      id: 'wheel_soft_glam',
      name: 'Soft Glam',
      description: 'Seamless neutral eye contour, romantic blush draping & satin mauve pillow-talk lip',
      eyeshadowColor: '#886259',
      eyeshadowOpacity: 0.65,
      eyelinerColor: '#3c231c',
      eyelinerOpacity: 0.8,
      eyelinerStyle: 'winged',
      blushColor: '#d87080',
      blushOpacity: 0.45,
      lipColor: '#b25368',
      lipOpacity: 0.85,
      lipGloss: false,
      lashesStyle: 'wispy',
      glitterLevel: 25,
      filter: 'vintage',
    }
  },
  {
    id: 'clean_girl',
    name: 'Clean Girl',
    iconType: 'sparkles',
    emoji: '✦',
    subtitle: 'FRESH • MINIMALIST',
    vibe: 'Glazed Glass Skin',
    description: 'Minimalist glass skin finish, fluffy lifted brows, and a sheer hydrating rose balm.',
    bgGradient: '#eee3dc',
    textColor: '#382327',
    subtextColor: '#704850',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'vertical',
    tags: ['Glass Skin', 'Dewy', 'Everyday'],
    preset: {
      id: 'wheel_clean_girl',
      name: 'Clean Girl',
      description: 'Minimalist glazed skin finish, lifted brows & sheer petal rose balm',
      eyeshadowColor: '#fdf2e9',
      eyeshadowOpacity: 0.3,
      blushColor: '#fbb6ce',
      blushOpacity: 0.35,
      lipColor: '#f472b6',
      lipOpacity: 0.6,
      lipGloss: true,
      lashesStyle: 'natural',
      glitterLevel: 15,
      filter: 'none',
    }
  },
  {
    id: '90s_nude',
    name: '90s Nude',
    iconType: 'lips',
    emoji: '👄',
    subtitle: 'MATTE • ICONIC CONTOUR',
    vibe: 'Vintage Sepia Contrast',
    description: 'Deep sculpted lip liner with soft satin sepia center, matte lid wash, and defined flutter lashes.',
    bgGradient: '#cbb9b0',
    textColor: '#382327',
    subtextColor: '#704850',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'diagonal',
    tags: ['90s Lip', 'Contour', 'Sepia'],
    preset: {
      id: 'wheel_90s_nude',
      name: '90s Nude',
      description: '90s sepia contour lip liner, matte neutral lid wash & defined flutter lashes',
      eyeshadowColor: '#78716c',
      eyeshadowOpacity: 0.5,
      eyelinerColor: '#44403c',
      eyelinerOpacity: 0.8,
      blushColor: '#a8a29e',
      blushOpacity: 0.45,
      lipColor: '#78350f',
      lipOpacity: 0.9,
      lipGloss: false,
      lashesStyle: 'natural',
      glitterLevel: 10,
      filter: 'vintage',
    }
  },
  {
    id: 'cherry_cola',
    name: 'Cherry Cola',
    iconType: 'cherries',
    emoji: '🍒',
    subtitle: 'JUICY • PLAYFUL',
    vibe: 'Deep Maroon High-Gloss',
    description: 'Juicy burgundy lacquer lips paired with a warm diffused brick lid and subtle winged definition.',
    bgGradient: '#ebe2dc',
    textColor: '#382327',
    subtextColor: '#704850',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'horizontal',
    tags: ['Burgundy', 'Bold', 'High Gloss'],
    preset: {
      id: 'wheel_cherry_cola',
      name: 'Cherry Cola',
      description: 'Deep maroon lip lacquer, flushed burgundy blush & diffused bronze wing',
      eyeshadowColor: '#7f1d1d',
      eyeshadowOpacity: 0.65,
      eyelinerColor: '#450a0a',
      eyelinerOpacity: 0.85,
      eyelinerStyle: 'winged',
      blushColor: '#be123c',
      blushOpacity: 0.55,
      lipColor: '#581c87',
      lipOpacity: 0.95,
      lipGloss: true,
      lashesStyle: 'wispy',
      glitterLevel: 45,
      filter: 'warm-glow',
    }
  },
  {
    id: 'berry_velvet',
    name: 'Berry Velvet',
    iconType: 'butterfly',
    emoji: '🦋',
    subtitle: 'RICH • ROMANTIC',
    vibe: 'Parisian Stained Plum',
    description: 'Soft blurred berry popsicle stain on the lips, romantic mauve cheeks, and fluttery lashes.',
    bgGradient: '#ead4ce',
    textColor: '#382327',
    subtextColor: '#704850',
    iconColor: '#6b5048',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    boxShadow: '11px 14px 24px rgba(82,65,55,.14), -9px -9px 22px rgba(255,255,255,.95)',
    tiltAngle: 0,
    orientation: 'diagonal',
    tags: ['Romantic', 'Plum Stain', 'Chic'],
    preset: {
      id: 'wheel_berry_velvet',
      name: 'Berry Velvet',
      description: 'French-girl berry popsicle stain, romantic mauve blush & soft diffused lid',
      eyeshadowColor: '#831843',
      eyeshadowOpacity: 0.5,
      eyelinerColor: '#500724',
      eyelinerOpacity: 0.6,
      blushColor: '#db2777',
      blushOpacity: 0.5,
      lipColor: '#9d174d',
      lipOpacity: 0.9,
      lipGloss: false,
      lashesStyle: 'wispy',
      glitterLevel: 25,
      filter: 'vintage',
    }
  }
];

// Minimalist Fine-Line SVG Icons matching the reference image precisely
const LookIcon: React.FC<{ type: WheelLookItem['iconType']; color: string }> = ({ type, color }) => {
  switch (type) {
    case 'sun':
      return (
        <svg className="w-5 h-5 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.2" />
          <line x1="12" y1="2" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22" y2="12" />
          <line x1="5" y1="5" x2="6.8" y2="6.8" />
          <line x1="17.2" y1="17.2" x2="19" y2="19" />
          <line x1="5" y1="19" x2="6.8" y2="17.2" />
          <line x1="17.2" y1="6.8" x2="19" y2="5" />
        </svg>
      );
    case 'coffee':
      return (
        <svg className="w-5 h-5 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h11v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" />
          <path d="M15 9.5h2a2 2 0 0 1 2 2v0.5a2 2 0 0 1-2 2h-2" />
          <line x1="2.5" y1="19.5" x2="16.5" y2="19.5" />
        </svg>
      );
    case 'moon':
      return (
        <svg className="w-5 h-5 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      );
    case 'heart':
      return (
        <svg className="w-5 h-5 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg className="w-5 h-5 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" />
          <circle cx="12" cy="12" r="0.9" fill={color} stroke="none" />
        </svg>
      );
    case 'lips':
      return (
        <svg className="w-6 h-4 sm:w-10 sm:h-7" viewBox="0 0 24 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8C5 4.5 8 3.5 12 5.5C16 3.5 19 4.5 22 8C19 12 16 13 12 11.5C8 13 5 12 2 8Z" />
          <path d="M2 8C6 9.5 10 9 12 8.5C14 9 18 9.5 22 8" />
        </svg>
      );
    case 'cherries':
      return (
        <svg className="w-5 h-5 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="16.5" r="3.2" />
          <circle cx="16" cy="16" r="3.2" />
          <path d="M7 13.5C8 7.5 12 4.5 16.5 4" />
          <path d="M16 13C15 8 14 5.5 16.5 4" />
          <path d="M16.5 4C19 3 21 3.5 21 5.5C20.5 7 18 6.5 16.5 4Z" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg className="w-6 h-5 sm:w-10 sm:h-8" viewBox="0 0 24 20" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="3" x2="12" y2="18" />
          <path d="M12 5C15.5 1.5 21.5 3 21.5 8.5C21.5 13.5 15.5 15 12 14.5" />
          <path d="M12 5C8.5 1.5 2.5 3 2.5 8.5C2.5 13.5 8.5 15 12 14.5" />
          <path d="M12 14.5C15 14.5 19 16 18 19C16.5 20.5 13.5 18 12 16" />
          <path d="M12 14.5C9 14.5 5 16 6 19C7.5 20.5 10.5 18 12 16" />
        </svg>
      );
  }
};

// Luxury Makeup Brush Pointer (Points downwards at the top winning slot above Clean Girl)
const MakeupBrushPointer: React.FC<{ isSpinning: boolean; isLanding: boolean }> = ({ 
  isSpinning, 
  isLanding 
}) => {
  return (
    <div className="flex flex-col items-center pointer-events-none select-none relative">
      <motion.div 
        className="flex flex-col items-center"
        animate={
          isLanding
            ? { y: [0, 16, 3, 10, 0], rotate: [0, -4, 4, -2, 0] }
            : isSpinning
            ? { y: [0, -4, 0], rotate: [-3, 3, -3] }
            : { y: [0, -2, 0], rotate: 0 }
        }
        transition={
          isLanding
            ? { duration: 0.95, ease: [0.22, 1, 0.36, 1] }
            : { repeat: Infinity, duration: isSpinning ? 0.28 : 2.4, ease: "easeInOut" }
        }
      >
        <div className="relative flex flex-col items-center drop-shadow-[0_4px_12px_rgba(150,90,70,0.35)]">
          {/* Makeup Brush Graphic */}
          <svg 
            className="w-7 h-11 sm:w-10 sm:h-16" 
            viewBox="0 0 40 68" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Slender Handle Gradient */}
              <linearGradient id="brushHandleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CBB5A1" />
                <stop offset="35%" stopColor="#F8EFE6" />
                <stop offset="70%" stopColor="#D8C3B0" />
                <stop offset="100%" stopColor="#A8907D" />
              </linearGradient>
              {/* Rose Gold Metallic Ferrule Gradient */}
              <linearGradient id="brushFerruleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#BA7550" />
                <stop offset="30%" stopColor="#FEE4D2" />
                <stop offset="70%" stopColor="#CF8761" />
                <stop offset="100%" stopColor="#8C4E2D" />
              </linearGradient>
              {/* Fluffy Bristles Gradient: Dark cocoa root to soft ivory tip */}
              <linearGradient id="brushBristleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#301E17" />
                <stop offset="40%" stopColor="#4A342B" />
                <stop offset="75%" stopColor="#BCAAA4" />
                <stop offset="100%" stopColor="#FBE9E7" />
              </linearGradient>
            </defs>

            {/* Handle (Top slender wand) */}
            <path 
              d="M17.5 1 C17.5 0.5 18.5 0 20 0 C21.5 0 22.5 0.5 22.5 1 L22 22 L18 22 Z" 
              fill="url(#brushHandleGrad)" 
            />

            {/* Rose Gold Ferrule */}
            <rect x="16.5" y="22" width="7" height="13" rx="1.5" fill="url(#brushFerruleGrad)" />
            <line x1="16.5" y1="25.5" x2="23.5" y2="25.5" stroke="#683418" strokeWidth="0.6" />
            <line x1="16.5" y1="31" x2="23.5" y2="31" stroke="#683418" strokeWidth="0.6" />

            {/* Fluffy Tapered Bristle Head pointing downwards */}
            <path 
              d="M16 35 C15 42 12.5 51 18 63 C19 65.5 21 65.5 22 63 C27.5 51 25 42 24 35 Z" 
              fill="url(#brushBristleGrad)" 
            />

            {/* Bristle Highlight Reflection */}
            <path 
              d="M18.8 56 C19.5 61 20.5 61 21.2 56" 
              stroke="#FFF8F4" 
              strokeWidth="1.2" 
              strokeLinecap="round" 
              opacity="0.9" 
            />
          </svg>

          {/* Indicator Dot / Sparkle pulse directly below brush tip */}
          <div className="relative flex items-center justify-center mt-0.5">
            <motion.div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-tr from-[#E91E63] to-[#F59E0B] shadow-[0_0_12px_#E91E63]"
              animate={
                isLanding 
                  ? { scale: [1, 2.4, 1.3], opacity: [0.7, 1, 0.9] } 
                  : isSpinning 
                  ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] } 
                  : { scale: [1, 1.15, 1], opacity: [0.7, 0.95, 0.7] }
              }
              transition={
                isLanding
                  ? { duration: 0.95, ease: "easeOut" }
                  : { repeat: Infinity, duration: isSpinning ? 0.25 : 1.8 }
              }
            />

            {/* Radial celebratory ripple ring on landing */}
            {isLanding && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 2.4, 3.2], opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="absolute -inset-2 rounded-full border-2 border-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.8)] pointer-events-none"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface SpinWheelSurpriseSectionProps {
  onTryOn: (preset: PresetLook) => void;
  onNavigate: (tab: any) => void;
}

export const SpinWheelSurpriseSection: React.FC<SpinWheelSurpriseSectionProps> = ({
  onTryOn,
  onNavigate
}) => {
  // Dual mode: 'spotlight' (stationary orbs, ring counter moves, no brush) vs 'motion' (circles spin around, brush appears)
  const [wheelMode, setWheelMode] = useState<'spotlight' | 'motion'>('spotlight');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLandingAnimation, setIsLandingAnimation] = useState(false);
  const [motionRotation, setMotionRotation] = useState(0);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);
  const [centerLabel, setCenterLabel] = useState('Surprise Me');
  const [winnerLook, setWinnerLook] = useState<WheelLookItem | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  
  const timerRef = useRef<any>(null);
  const resetLabelTimerRef = useRef<any>(null);

  // Escape key listener to close modal reliably
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWinnerModalOpen) {
        setIsWinnerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWinnerModalOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resetLabelTimerRef.current) clearTimeout(resetLabelTimerRef.current);
    };
  }, []);

  const totalSlices = WHEEL_LOOKS.length; // 8

  // Glitter confetti burst for Spotlight wheel landing
  const triggerGlitterConfetti = () => {
    try {
      const colors = ['#F59E0B', '#F43F5E', '#EC4899', '#FB7185', '#FDE68A', '#D97706', '#E11D48'];

      // Center celebratory glitter confetti burst
      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.6 },
        colors,
        ticks: 200,
        gravity: 1.1,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['circle'],
        scalar: 0.8,
      });

      // Side shimmer sparkles cascade
      setTimeout(() => {
        confetti({
          particleCount: 35,
          angle: 60,
          spread: 55,
          origin: { x: 0.2, y: 0.65 },
          colors: ['#FDE68A', '#FCD34D', '#F472B6', '#FDA4AF', '#FFFFFF'],
          ticks: 180,
          gravity: 0.95,
          scalar: 0.65,
        });
        confetti({
          particleCount: 35,
          angle: 120,
          spread: 55,
          origin: { x: 0.8, y: 0.65 },
          colors: ['#FDE68A', '#FCD34D', '#F472B6', '#FDA4AF', '#FFFFFF'],
          ticks: 180,
          gravity: 0.95,
          scalar: 0.65,
        });
      }, 140);
    } catch (err) {
      console.error('Confetti animation error', err);
    }
  };

  // Handle spin for both Spotlight Mode and Motion Wheel Mode
  const handleSpin = () => {
    if (isSpinning || isLandingAnimation) return;

    if (resetLabelTimerRef.current) clearTimeout(resetLabelTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSpinning(true);
    setIsLandingAnimation(false);
    setWinnerLook(null);
    setIsWinnerModalOpen(false);
    setCenterLabel('Choosing…');

    // Pick random target index (0 to 7)
    const targetIndex = Math.floor(Math.random() * totalSlices);
    const targetLook = WHEEL_LOOKS[targetIndex];

    if (wheelMode === 'spotlight') {
      // SPOTLIGHT MODE:
      // The circles DO NOT MOVE. Only the ring counter moves around the orbs.
      // Makeup brush is removed in this mode.
      setActiveHighlightIndex(null);
      const rounds = 16 + Math.floor(Math.random() * 8);
      let i = 0;

      timerRef.current = setInterval(() => {
        const currIdx = i % totalSlices;
        setActiveHighlightIndex(currIdx);
        i++;

        if (i >= rounds) {
          clearInterval(timerRef.current);
          setIsSpinning(false);
          setActiveHighlightIndex(targetIndex);
          setCenterLabel(targetLook.name);
          setWinnerLook(targetLook);

          // For the spotlight wheel: trigger glitter confetti, then show popup card
          triggerGlitterConfetti();

          setTimeout(() => {
            setIsWinnerModalOpen(true);
          }, 950);

          resetLabelTimerRef.current = setTimeout(() => {
            setCenterLabel('Surprise Me');
          }, 3200);
        }
      }, 115);

    } else {
      // MOTION WHEEL MODE:
      // The circles spin around in a full orbital spin! Makeup brush is active above.
      const fullSpins = (5 + Math.floor(Math.random() * 2)) * 360;
      const targetAngle = targetIndex * 45; // o1=0, o2=45, o3=90, etc.
      const currentBase = motionRotation;
      const nextRotation = currentBase + fullSpins + (360 - (currentBase % 360)) + (360 - targetAngle);

      setMotionRotation(nextRotation);

      const duration = 4000;
      const startTime = Date.now();

      // Audio/visual ticker tracking which slice is currently passing under the 12 o'clock brush
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          clearInterval(timerRef.current);
        } else {
          const progress = elapsed / duration;
          const currentRot = currentBase + (nextRotation - currentBase) * Math.sin((progress * Math.PI) / 2);
          const currentSlice = Math.floor(((360 - (currentRot % 360) + 22.5) % 360) / 45) % totalSlices;
          setActiveHighlightIndex(currentSlice);
        }
      }, 90);

      setTimeout(() => {
        clearInterval(timerRef.current);
        setIsSpinning(false);
        setActiveHighlightIndex(targetIndex);
        setWinnerLook(targetLook);
        setCenterLabel(targetLook.name);

        // Makeup brush dips down onto the top winning formula that landed at 12 o'clock
        setIsLandingAnimation(true);

        // Leave for split second (1.1s) so user sees makeup brush animation of what it lands on, then show popup
        setTimeout(() => {
          setIsLandingAnimation(false);
          setIsWinnerModalOpen(true);
        }, 1100);

        resetLabelTimerRef.current = setTimeout(() => {
          setCenterLabel('Surprise Me');
        }, 3200);
      }, duration);
    }
  };

  // Direct orb tap to choose and inspect
  const handleChooseLook = (index: number) => {
    if (isSpinning) return;
    if (resetLabelTimerRef.current) clearTimeout(resetLabelTimerRef.current);

    const chosen = WHEEL_LOOKS[index];
    setActiveHighlightIndex(index);
    setCenterLabel(chosen.name);
    setWinnerLook(chosen);

    if (wheelMode === 'motion') {
      // In motion mode, smoothly bring that orb to top under the brush
      const currentBase = motionRotation;
      const targetAngle = index * 45;
      const nextRotation = currentBase + 360 + (360 - (currentBase % 360)) + (360 - targetAngle);
      setMotionRotation(nextRotation);
      setIsSpinning(true);

      setTimeout(() => {
        setIsSpinning(false);
        setIsLandingAnimation(true);
        setTimeout(() => {
          setIsLandingAnimation(false);
          setIsWinnerModalOpen(true);
        }, 950);
      }, 650);
    } else {
      // In spotlight mode, trigger glitter confetti and open preview modal
      triggerGlitterConfetti();
      setTimeout(() => {
        setIsWinnerModalOpen(true);
      }, 750);
    }

    resetLabelTimerRef.current = setTimeout(() => {
      setCenterLabel('Surprise Me');
    }, 2800);
  };

  return (
    <section 
      id="dont-know-what-to-try-wheel" 
      className="my-8 sm:my-14 text-left relative w-full space-y-3"
    >
      {/* Full-width screen ambient soft shadow backdrop with smooth zero-opacity falloff (no harsh edges) */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-screen max-w-[100vw] -inset-y-8 pointer-events-none -z-10 overflow-visible"
        style={{
          background: 'radial-gradient(ellipse 96% 76% at 50% 50%, rgba(180, 145, 135, 0.16) 0%, rgba(180, 145, 135, 0.08) 45%, rgba(180, 145, 135, 0.02) 75%, transparent 100%)',
          filter: 'blur(20px)'
        }}
        aria-hidden="true"
      />

      {/* SECTION BREAK HEADER: BEAUTY ROULETTE (Outside the card on the top left) */}
      <div className="flex items-center gap-2.5 px-3 sm:px-6 lg:px-0 pt-1 pb-0.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#EDE7E3] shadow-xs text-[9.5px] sm:text-[10.5px] font-bold text-[#B8887A] uppercase tracking-[0.18em]">
          <Sparkles className="w-3 h-3 text-[#E91E63]" />
          <span>BEAUTY ROULETTE</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-[#EDE7E3] via-[#EDE7E3]/60 to-transparent" />
      </div>

      {/* Outer Alabaster Sculptural Canvas (Matching reference image aesthetic) */}
      <div className="glass-card rounded-[28px] px-3.5 sm:px-8 py-6 sm:py-9 relative">
        
        {/* Soft Ambient Warm Blush Center Glow (Contained inside card rounded boundary) */}
        <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-gradient-to-tr from-[#F7C6D7]/20 via-[#FCE4E8]/25 to-[#F5D5DC]/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Section Header (Inter Sans Font as requested) */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-8 text-center sm:text-left px-1">
          <div className="space-y-1 mx-auto sm:mx-0">
            <h3 
              className="text-2xl sm:text-3xl lg:text-[34px] text-[#2A1715] font-semibold tracking-tight leading-tight pt-0.5 sm:pt-1"
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" }}
            >
              Dont know what to try? suprise me
            </h3>
          </div>

          {/* Quick status button */}
          {winnerLook && (
            <button
              type="button"
              onClick={() => setIsWinnerModalOpen(true)}
              className="self-center sm:self-auto shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 hover:bg-white text-[11px] sm:text-xs font-bold text-[#B8887A] border border-[#EDE7E3] shadow-xs flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
            >
              <span>Selected:</span>
              <span className="font-extrabold text-[#2A1715] truncate max-w-[120px]">{winnerLook.name}</span>
              <ArrowRight className="w-3 h-3 text-[#E91E63]" />
            </button>
          )}
        </div>

        {/* THE LUXURY MAKEUP BRUSH INDICATOR POINTER (Shown ONLY in Motion Wheel Mode, removed in Spotlight Mode) */}
        {wheelMode === 'motion' && (
          <div className="flex justify-center -mb-4 sm:-mb-6 z-30 pointer-events-none relative transition-opacity duration-300">
            <MakeupBrushPointer isSpinning={isSpinning} isLanding={isLandingAnimation} />
          </div>
        )}

        {/* THE STAGE AND ORB UI */}
        <div className="relative z-10 w-full flex items-center justify-center select-none py-2 sm:py-4">
          <main 
            className={`stage ${isSpinning && wheelMode === 'spotlight' ? 'spinning' : ''}`} 
            id="stage" 
            aria-label="TryOn Beauty surprise look selector"
          >
            {/* The 8 surrounding orbs (contained in a rotatable wrapper for Motion Wheel Mode) */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: wheelMode === 'motion' ? `rotate(${motionRotation}deg)` : 'none',
                transition: isSpinning && wheelMode === 'motion'
                  ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                  : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                transformOrigin: '50% 50%',
                willChange: 'transform'
              }}
            >
              {/* o1: Golden Hour (sun) */}
              <button 
                type="button"
                className={`orb o1 pointer-events-auto ${activeHighlightIndex === 0 ? 'active' : ''}`} 
                aria-label="Golden Hour" 
                data-look="Golden Hour"
                onClick={() => handleChooseLook(0)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r="8"/>
                    <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.3 4.3M33.1 33.1l4.3 4.3M37.4 10.6l-4.3 4.3M14.9 33.1l-4.3 4.3"/>
                  </svg>
                </div>
              </button>

              {/* o2: Espresso Glaze (coffee) */}
              <button 
                type="button"
                className={`orb o2 pointer-events-auto ${activeHighlightIndex === 1 ? 'active' : ''}`} 
                aria-label="Espresso Glaze" 
                data-look="Espresso Glaze"
                onClick={() => handleChooseLook(1)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M12 17h23v12a10 10 0 0 1-10 10h-3a10 10 0 0 1-10-10V17Z"/>
                    <path d="M35 20h3.5a5.5 5.5 0 0 1 0 11H35M9 42h31"/>
                  </svg>
                </div>
              </button>

              {/* o3: Siren Eye (moon) */}
              <button 
                type="button"
                className={`orb o3 pointer-events-auto ${activeHighlightIndex === 2 ? 'active' : ''}`} 
                aria-label="Siren Eye" 
                data-look="Siren Eye"
                onClick={() => handleChooseLook(2)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M33 38A16 16 0 1 1 26 8a13.3 13.3 0 0 0 7 30Z"/>
                  </svg>
                </div>
              </button>

              {/* o4: Soft Glam (heart) */}
              <button 
                type="button"
                className={`orb o4 pointer-events-auto ${activeHighlightIndex === 3 ? 'active' : ''}`} 
                aria-label="Soft Glam" 
                data-look="Soft Glam"
                onClick={() => handleChooseLook(3)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M24 39 8.7 24.2A9.4 9.4 0 0 1 22 10.9L24 13l2-2.1a9.4 9.4 0 0 1 13.3 13.3Z"/>
                  </svg>
                </div>
              </button>

              {/* o5: Clean Girl (sparkle) */}
              <button 
                type="button"
                className={`orb o5 pointer-events-auto ${activeHighlightIndex === 4 ? 'active' : ''}`} 
                aria-label="Clean Girl" 
                data-look="Clean Girl"
                onClick={() => handleChooseLook(4)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M24 7c2.2 8.4 6.4 12.6 15 15-8.6 2.4-12.8 6.6-15 15-2.2-8.4-6.4-12.6-15-15 8.6-2.4 12.8-6.6 15-15Z"/>
                  </svg>
                </div>
              </button>

              {/* o6: 90s Nude (lips) */}
              <button 
                type="button"
                className={`orb o6 pointer-events-auto ${activeHighlightIndex === 5 ? 'active' : ''}`} 
                aria-label="90s Nude" 
                data-look="90s Nude"
                onClick={() => handleChooseLook(5)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M6 25c6.5-7 11-9.8 18-4.8 7-5 11.5-2.2 18 4.8-5 7.3-11.2 10.5-18 10.5S11 32.3 6 25Z"/>
                    <path d="M8 25c8 2.4 24 2.4 32 0"/>
                  </svg>
                </div>
              </button>

              {/* o7: Cherry Cola (cherries) */}
              <button 
                type="button"
                className={`orb o7 pointer-events-auto ${activeHighlightIndex === 6 ? 'active' : ''}`} 
                aria-label="Cherry Cola" 
                data-look="Cherry Cola"
                onClick={() => handleChooseLook(6)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="17" cy="31" r="8"/>
                    <circle cx="34" cy="32" r="8"/>
                    <path d="M20 24c0-7 3-13 10-17M32 24c-1-6-3-11-9-14M30 7c4 0 6 1 8 4-4 1-7 0-9-2"/>
                  </svg>
                </div>
              </button>

              {/* o8: Berry Velvet (butterfly) */}
              <button 
                type="button"
                className={`orb o8 pointer-events-auto ${activeHighlightIndex === 7 ? 'active' : ''}`} 
                aria-label="Berry Velvet" 
                data-look="Berry Velvet"
                onClick={() => handleChooseLook(7)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: wheelMode === 'motion' ? `rotate(${-motionRotation}deg)` : 'none',
                    transition: isSpinning && wheelMode === 'motion'
                      ? 'transform 4000ms cubic-bezier(0.12, 0.85, 0.18, 1)'
                      : wheelMode === 'motion' ? 'transform 650ms cubic-bezier(0.12, 0.85, 0.18, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M24 24c-6-12-17-14-18-5-.8 6.4 6.5 11 15 10-6.4 2.7-8 10.5-2 12 4.7 1.2 6-6.2 5-17Z"/>
                    <path d="M24 24c6-12 17-14 18-5 .8 6.4-6.5 11-15 10 6.4 2.7 8 10.5 2 12-4.7 1.2-6-6.2-5-17Z"/>
                  </svg>
                </div>
              </button>
            </div>

            {/* Center: Surprise Me button (Stationary, never rotates with the orbs) */}
            <button 
              type="button"
              className="orb center" 
              id="spin" 
              aria-label="Surprise me"
              onClick={handleSpin}
              disabled={isSpinning}
            >
              <span>
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M24 7c2.2 8.4 6.4 12.6 15 15-8.6 2.4-12.8 6.6-15 15-2.2-8.4-6.4-12.6-15-15 8.6-2.4 12.8-6.6 15-15Z"/>
                </svg>
                <span className="label" id="centerLabel">{centerLabel}</span>
                <span className="hint">Tap to spin</span>
              </span>
            </button>
          </main>
        </div>

        {/* SWITCH MODE SMALL BUTTON UNDER THE FULL CIRCLE */}
        <div className="relative z-20 flex flex-col items-center justify-center gap-2 pt-2 sm:pt-3">
          <div className="inline-flex items-center gap-1 p-1 glass-card rounded-full text-xs">
            <button
              type="button"
              id="wheel-mode-spotlight-btn"
              onClick={() => {
                if (isSpinning) return;
                setWheelMode('spotlight');
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer ${
                wheelMode === 'spotlight'
                  ? 'bg-[#2A1715] text-white'
                  : 'text-stone-500 hover:text-[#2A1715]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${wheelMode === 'spotlight' ? 'text-white' : 'text-[#E91E63]'}`} />
              <span>Spotlight</span>
            </button>

            <button
              type="button"
              id="wheel-mode-motion-btn"
              onClick={() => {
                if (isSpinning) return;
                setWheelMode('motion');
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer ${
                wheelMode === 'motion'
                  ? 'bg-[#2A1715] text-white'
                  : 'text-stone-500 hover:text-[#2A1715]'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${wheelMode === 'motion' ? 'text-white' : 'text-[#E91E63]'}`} />
              <span>Motion</span>
            </button>
          </div>
        </div>

      </div>

      {/* WINNER & LOOK DETAIL MODAL (Matching ethereal glass aesthetic) */}
      <AnimatePresence>
        {isWinnerModalOpen && winnerLook && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsWinnerModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-sheet rounded-[32px] p-6 sm:p-7 relative text-left overflow-hidden"
            >
              {/* Confetti / Top Accent Glow */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#F7C6D7]/35 via-[#FDBA74]/15 to-transparent pointer-events-none" />

              {/* Close Button with High Z-Index & Generous 44px Touch Target */}
              <button
                type="button"
                id="close-winner-modal-btn"
                aria-label="Close formula modal"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsWinnerModalOpen(false);
                }}
                className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-stone-100/95 hover:bg-stone-200 active:scale-95 text-stone-700 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-xs border border-stone-200 pointer-events-auto"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Header Badge */}
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FDF1F4] text-[#E91E63] border border-[#F7C6D7] text-[11px] font-extrabold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>{isSpinning ? 'SPINNING...' : 'FORMULA SELECTED'}</span>
                </div>

                {/* Look Title + Subtitle */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl border shadow-xs flex items-center justify-center shrink-0"
                    style={{
                      background: winnerLook.bgGradient,
                      borderColor: winnerLook.borderColor,
                      boxShadow: winnerLook.boxShadow
                    }}
                  >
                    <LookIcon type={winnerLook.iconType} color={winnerLook.iconColor} />
                  </div>
                  <div>
                    <h3 
                      className="font-display text-2xl sm:text-3xl text-[#2A1715] leading-tight font-normal"
                      style={{ fontFamily: "'Ultra Disney Pro', 'Ultra Disney', 'Ultra', serif" }}
                    >
                      {winnerLook.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-[#B8887A] tracking-wide uppercase">
                      {winnerLook.subtitle}
                    </p>
                  </div>
                </div>

                {/* Detailed Summary */}
                <p className="text-xs sm:text-sm text-[#4A3B35] leading-relaxed pt-1">
                  {winnerLook.description}
                </p>

                {/* Makeup Formula Breakdown */}
                <div className="p-3.5 rounded-2xl bg-[#FDF9F6] border border-[#EDE7E3] space-y-2 text-xs">
                  <span className="text-[10px] font-black text-[#B8887A] uppercase tracking-wider block">
                    Formula Breakdown
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-stone-700">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow-2xs shrink-0" 
                        style={{ backgroundColor: winnerLook.preset.eyeshadowColor }}
                      />
                      <span className="font-medium truncate">Eyes: {winnerLook.preset.eyeshadowColor}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow-2xs shrink-0" 
                        style={{ backgroundColor: winnerLook.preset.blushColor }}
                      />
                      <span className="font-medium truncate">Blush: {winnerLook.preset.blushColor}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow-2xs shrink-0" 
                        style={{ backgroundColor: winnerLook.preset.lipColor }}
                      />
                      <span className="font-medium truncate">Lips: {winnerLook.preset.lipColor}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Layers className="w-3 h-3 text-[#B8887A] shrink-0" />
                      <span className="font-medium capitalize">Lashes: {winnerLook.preset.lashesStyle}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Action: TRY NOW */}
                <div className="pt-3 space-y-2">
                  <button
                    type="button"
                    id="wheel-try-now-btn"
                    onClick={() => {
                      setIsWinnerModalOpen(false);
                      onTryOn(winnerLook.preset);
                      onNavigate('sandbox');
                    }}
                    className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] hover:brightness-105 active:scale-98 text-white text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_6px_20px_rgba(233,30,99,0.32),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>TRY NOW</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsWinnerModalOpen(false);
                      setTimeout(() => handleSpin(), 200);
                    }}
                    className="w-full py-2.5 rounded-full text-xs font-bold text-stone-600 hover:text-black transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Spin Again</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
