import React from 'react';

/**
 * DiscoverSculpturalText
 * Implements the 3D architectural slit-crease paper relief typography
 * matching the VIBIA reference image:
 * The text is the exact same colour as the canvas background (#faf7f5),
 * with subtle light and shadow creating an embossed/slit paper sculpture.
 */
export interface DiscoverSculpturalTextProps {
  className?: string;
  onClick?: () => void;
}

export const DiscoverSculpturalText: React.FC<DiscoverSculpturalTextProps> = ({ 
  className = '',
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      title={onClick ? 'Click to view Community Looks' : undefined}
      className={`w-full flex items-center justify-center py-4 sm:py-6 overflow-hidden select-none transition-all duration-300 ${
        onClick ? 'cursor-pointer group hover:opacity-95 active:scale-[0.99]' : 'pointer-events-none'
      } ${className}`}
    >
      <div className="w-full max-w-[900px] px-4 sm:px-8">
        <div 
          className="w-full flex items-center justify-between text-center font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-extralight tracking-[0.38em] sm:tracking-[0.45em] text-3xl sm:text-5xl md:text-6xl uppercase group-hover:tracking-[0.39em] sm:group-hover:tracking-[0.46em] transition-all duration-300"
          style={{
            color: '#faf7f5', // EXACT SAME COLOUR AS BACKGROUND
            textShadow: `
              -1px -1px 0px rgba(255, 255, 255, 0.95),
              1px 1px 1px rgba(185, 175, 166, 0.5),
              2px 3px 5px rgba(175, 163, 153, 0.25),
              -2px 0px 4px rgba(160, 145, 135, 0.15)
            `,
          }}
        >
          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200">
            D
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, transparent 50%, rgba(170,155,145,0.18) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              D
            </span>
          </span>

          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200 delay-75">
            I
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, rgba(160,145,135,0.25) 0%, rgba(255,255,255,0.85) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              I
            </span>
          </span>

          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200 delay-100">
            S
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%, rgba(165,150,140,0.2) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              S
            </span>
          </span>

          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200 delay-150">
            C
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%, rgba(165,150,140,0.2) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              C
            </span>
          </span>

          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200 delay-200">
            O
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(165,150,140,0.2) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              O
            </span>
          </span>

          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200 delay-200">
            V
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(110deg, rgba(160,145,135,0.3) 0%, rgba(255,255,255,0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              V
            </span>
          </span>

          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200 delay-150">
            E
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%, rgba(165,150,140,0.2) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              E
            </span>
          </span>

          <span className="relative inline-block transition-transform group-hover:-translate-y-0.5 duration-200 delay-100">
            R
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, transparent 55%, rgba(165,150,140,0.22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              R
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
