import React, { useEffect, useRef } from 'react';

interface GlitterConfettiProps {
  active: boolean;
  durationMs?: number; // default 3000ms (3 seconds)
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'diamond' | 'star' | 'strip' | 'hex';
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  scaleX: number;
  scaleY: number;
}

const GLITTER_COLORS = [
  '#f43f5e', // Rose Pink
  '#fb7185', // Soft Rose
  '#e0a96d', // Rose Gold / Bronze
  '#fbbf24', // 24K Gold
  '#fef08a', // Champagne Gold
  '#f59e0b', // Deep Amber
  '#c084fc', // Holographic Lavender
  '#e879f9', // Shimmering Orchid
  '#ffffff', // Diamond White
  '#a7f3d0', // Opal Aqua Mint
  '#ffd1dc', // Pastel Pearl Pink
];

export const GlitterConfetti: React.FC<GlitterConfettiProps> = ({
  active,
  durationMs = 3000,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();
    const fadeStartTime = startTime + (durationMs - 700); // Start fading 700ms before end

    // Set canvas dimensions with DPR support
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const updateSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    updateSize();

    window.addEventListener('resize', updateSize);

    // Generate ~140 luxury glitter particles falling from top
    const particleCount = Math.min(Math.floor(window.innerWidth / 9), 160);
    const particles: Particle[] = [];

    const shapes: Particle['shape'][] = ['diamond', 'star', 'circle', 'hex', 'strip'];

    for (let i = 0; i < particleCount; i++) {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * (window.innerHeight * 0.4), // staggered spawn above screen
        size: shape === 'strip' ? 3 + Math.random() * 4 : 4 + Math.random() * 6,
        color: GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)],
        shape,
        vx: (Math.random() - 0.5) * 2.2, // gentle horizontal drift
        vy: 2.8 + Math.random() * 4.5,   // fall speed
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.15,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.08,
        opacity: 0.85 + Math.random() * 0.15,
        twinkleSpeed: 0.08 + Math.random() * 0.12,
        twinkleOffset: Math.random() * Math.PI * 2,
        scaleX: 1,
        scaleY: 1
      });
    }

    // Render loop
    const render = (now: number) => {
      const elapsed = now - startTime;

      if (elapsed >= durationMs) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (onComplete) onComplete();
        return;
      }

      // Calculate global fade-out during final 700ms
      let globalAlpha = 1;
      if (now > fadeStartTime) {
        globalAlpha = Math.max(0, 1 - (now - fadeStartTime) / 700);
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of particles) {
        // Physics update
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.5;
        p.y += p.vy;
        p.angle += p.angularVelocity;

        // 3D rotation simulation (wobble along X/Y)
        p.scaleX = Math.cos(p.angle);
        p.scaleY = Math.sin(p.wobble * 1.2);

        // Shimmer twinkle
        const twinkle = Math.sin(elapsed * p.twinkleSpeed * 0.05 + p.twinkleOffset);
        const particleOpacity = (0.6 + twinkle * 0.4) * p.opacity * globalAlpha;

        if (p.y > window.innerHeight + 50 || particleOpacity <= 0.01) {
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(p.scaleX, p.scaleY);
        ctx.globalAlpha = Math.max(0, Math.min(1, particleOpacity));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;

        const s = p.size;

        if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.7, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.7, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'star') {
          // 4-point glitter star
          ctx.beginPath();
          ctx.moveTo(0, -s * 1.4);
          ctx.quadraticCurveTo(0, 0, s * 1.4, 0);
          ctx.quadraticCurveTo(0, 0, 0, s * 1.4);
          ctx.quadraticCurveTo(0, 0, -s * 1.4, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s * 1.4);
          ctx.closePath();
          ctx.fill();

          // Bright center core
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'hex') {
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3;
            const hx = Math.cos(a) * s;
            const hy = Math.sin(a) * s;
            if (k === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'strip') {
          // Metallic confetti foil strip
          ctx.fillRect(-s * 1.6, -s * 0.5, s * 3.2, s);
        } else {
          // Circle sparkle
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [active, durationMs, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none'
      }}
    />
  );
};
