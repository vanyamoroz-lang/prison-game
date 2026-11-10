import { useEffect, useRef, useState } from 'react';

type SpriteAnimationOptions = {
  frameCount: number;
  fps: number;
  playing?: boolean;
  loop?: boolean;
  resetKey?: string | number;
  durations?: number[];
  onComplete?: () => void;
};

/**
 * Drives a sprite sheet with requestAnimationFrame.
 * Supports uniform fps or explicit per-frame durations in milliseconds.
 */
export function useSpriteAnimation({
  frameCount,
  fps,
  playing = true,
  loop = false,
  resetKey = 0,
  durations,
  onComplete,
}: SpriteAnimationOptions): number {
  const [frame, setFrame] = useState(0);
  const completeRef = useRef(onComplete);
  const durationsKey = durations?.join(',') ?? '';

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrame(0);
    if (!playing || frameCount <= 0) return;

    const parsedDurations = durationsKey ? durationsKey.split(',').map(Number) : null;
    const frameDuration = (index: number) =>
      Math.max(1, parsedDurations?.[index] ?? 1000 / Math.max(1, fps));

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let current = 0;
    let done = false;

    const tick = (now: number) => {
      elapsed += now - last;
      last = now;

      while (elapsed >= frameDuration(current)) {
        elapsed -= frameDuration(current);
        if (current + 1 >= frameCount) {
          if (loop) {
            current = 0;
          } else {
            current = frameCount - 1;
            done = true;
            break;
          }
        } else {
          current += 1;
        }
      }

      setFrame(current);
      if (done) {
        completeRef.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, frameCount, fps, loop, resetKey, durationsKey]);

  return frame;
}
