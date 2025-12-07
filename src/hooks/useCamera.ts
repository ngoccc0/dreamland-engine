import { useEffect, useRef, useState } from 'react';
import { createFrameLimiter, type FrameLimiter } from '@/lib/utils/frame-limiter';

export type Point = { x: number; y: number };

/**
 * Simple camera hook that interpolates current center toward a target center
 * using requestAnimationFrame and an ease-out cubic curve.
 *
 * Respects FPS settings (dl_fps_target and dl_vsync) from localStorage for frame-limiting.
 *
 * The hook is intentionally small: it exposes `current`, `setTarget`, and
 * `panTo` helpers so callers can drive smooth camera motion without
 * implementing their own RAF loops.
 */
export function useCamera(initial: Point, defaultDurationMs = 400) {
  const [current, setCurrent] = useState<Point>(initial);
  const targetRef = useRef<Point>(initial);
  const startRef = useRef<Point>(initial);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(defaultDurationMs);
  const rafRef = useRef<number | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const frameLimiterRef = useRef<FrameLimiter | null>(null);

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const tick = (now: number) => {
    // Initialize frame limiter on first call
    if (!frameLimiterRef.current) {
      frameLimiterRef.current = createFrameLimiter();
    }

    // Check if frame should be skipped based on FPS settings
    if (frameLimiterRef.current.shouldSkipFrame(now)) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (startTimeRef.current === null) startTimeRef.current = now;
    const elapsed = Math.max(0, now - (startTimeRef.current || 0));
    const d = Math.max(1, durationRef.current);
    const p = Math.min(1, elapsed / d);
    const e = easeOutCubic(p);
    const s = startRef.current;
    const t = targetRef.current;
    const nx = s.x + (t.x - s.x) * e;
    const ny = s.y + (t.y - s.y) * e;
    setCurrent({ x: nx, y: ny });
    if (p >= 1) {
      // finished
      startTimeRef.current = null;
      rafRef.current = null;
      if (frameLimiterRef.current) {
        frameLimiterRef.current.reset();
      }
      try { if (onCompleteRef.current) onCompleteRef.current(); } catch { }
      onCompleteRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        try { cancelAnimationFrame(rafRef.current); } catch { }
        rafRef.current = null;
      }
      if (frameLimiterRef.current) {
        frameLimiterRef.current.reset();
        frameLimiterRef.current = null;
      }
    };
  }, []);

  function setTarget(pt: Point) {
    targetRef.current = pt;
  }

  function panTo(pt: Point, durationMs?: number, onComplete?: () => void) {
    // initialize interpolation
    startRef.current = current;
    targetRef.current = pt;
    startTimeRef.current = null;
    if (typeof durationMs === 'number') durationRef.current = durationMs;
    // start RAF loop
    if (rafRef.current) {
      try { cancelAnimationFrame(rafRef.current); } catch { }
      rafRef.current = null;
    }
    onCompleteRef.current = onComplete ?? null;
    rafRef.current = requestAnimationFrame(tick);
  }

  return {
    current,
    setTarget,
    panTo,
  };
}
