import { useCallback, useEffect, useRef, useState } from 'react';
import type { EyeStyleConfig } from '../game/characterAssets';

type Blinker = {
  frame: number;
  blink: () => void;
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Random blinking with a small chance of a double blink.
 * Returns a sheet frame (0 = open, 1 = half, 2 = closed, 3 = half-open)
 * and a function to force a blink from the UI.
 */
export function useBlinker(style: EyeStyleConfig, enabled = true): Blinker {
  const [frame, setFrame] = useState(0);
  const timers = useRef<Set<number>>(new Set());
  const blinking = useRef(false);
  const styleRef = useRef(style);
  const runBlinkRef = useRef<() => void>(() => {});
  const scheduleNextRef = useRef<() => void>(() => {});
  const canBlink = enabled && style.motion === 'blink' && style.frames > 1;

  useEffect(() => {
    styleRef.current = style;
  }, [style]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
  }, []);

  const setTimer = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, Math.max(1, delay));
    timers.current.add(id);
  }, []);

  const scheduleNext = useCallback(() => {
    if (!canBlink) return;
    const [min, max] = styleRef.current.blinkDelay;
    setTimer(() => runBlinkRef.current(), randomBetween(min, max));
  }, [canBlink, setTimer]);

  useEffect(() => {
    scheduleNextRef.current = scheduleNext;
  }, [scheduleNext]);

  const runBlink = useCallback(() => {
    if (!canBlink || blinking.current) return;

    clearTimers();
    blinking.current = true;
    const sequence = styleRef.current.blinkSequence;
    const durations = styleRef.current.blinkDurations;
    let index = 0;

    const step = () => {
      if (index >= sequence.length) {
        setFrame(0);
        blinking.current = false;
        if (Math.random() < 0.18) {
          setTimer(() => runBlinkRef.current(), 120);
        } else {
          scheduleNextRef.current();
        }
        return;
      }

      setFrame(sequence[index]);
      const delay = Math.max(1, durations[index] ?? 60);
      index += 1;
      setTimer(step, delay);
    };

    step();
  }, [canBlink, clearTimers, setTimer]);

  useEffect(() => {
    runBlinkRef.current = runBlink;
  }, [runBlink]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrame(0);
    blinking.current = false;
    clearTimers();
    if (!canBlink) return;

    setTimer(() => runBlinkRef.current(), randomBetween(700, 1600));
    return () => {
      clearTimers();
      blinking.current = false;
    };
  }, [style.id, canBlink, clearTimers, setTimer]);

  const blink = useCallback(() => {
    if (!canBlink || blinking.current) return;
    clearTimers();
    runBlinkRef.current();
  }, [canBlink, clearTimers]);

  return { frame, blink };
}
