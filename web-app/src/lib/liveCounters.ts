import { useEffect, useRef, useState } from 'react';

/**
 * Counts towards a number rather than snapping to it. A board that moves while
 * you are looking at it should be something you can watch happen.
 */
export function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Ease out, so the last few numbers land softly.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** How much of the window has already gone, 0 to 1. */
  elapsed: number;
  done: boolean;
};

/** Ticks once a second towards a deadline. */
export function useCountdown(deadline: number, openedAt?: number): Countdown {
  const compute = (): Countdown => {
    const remaining = Math.max(0, deadline - Date.now());
    const window = openedAt ? Math.max(1, deadline - openedAt) : 0;
    return {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining % 86400000) / 3600000),
      minutes: Math.floor((remaining % 3600000) / 60000),
      seconds: Math.floor((remaining % 60000) / 1000),
      elapsed: window ? Math.min(1, 1 - remaining / window) : 0,
      done: remaining === 0
    };
  };

  const [state, setState] = useState<Countdown>(compute);

  useEffect(() => {
    const tick = window.setInterval(() => setState(compute()), 1000);
    return () => window.clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, openedAt]);

  return state;
}

/** The last moment of the current month, which is when a challenge closes. */
export function endOfThisMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
}

/** The first moment of the current month. */
export function startOfThisMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}
