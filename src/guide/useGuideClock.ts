import { useEffect, useRef, useState } from "react";
import { wrapPhase } from "./script";

const REDUCED_PHASE = 0.2;

/**
 * Incremental phase clock. Advances by dt / cycleMs so switching scripts
 * changes speed without jumping the phase. Frozen under reduced motion or
 * when paused; `scrub` then sets the held phase.
 */
export function useGuideClock(
  cycleMs: number,
  options: { reduceMotion: boolean; paused?: boolean; scrub?: number },
): number {
  const { reduceMotion, paused = false, scrub } = options;
  const held = reduceMotion || paused;
  const initial = reduceMotion ? REDUCED_PHASE : 0;
  const [phase, setPhase] = useState(initial);
  const phaseRef = useRef(phase);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (held) {
      lastRef.current = null;
      const next =
        scrub !== undefined ? wrapPhase(scrub) : reduceMotion ? REDUCED_PHASE : phaseRef.current;
      phaseRef.current = next;
      setPhase(next);
      return;
    }

    let frame = 0;
    function tick(now: number) {
      const last = lastRef.current;
      lastRef.current = now;
      if (last !== null) {
        const next = wrapPhase(phaseRef.current + (now - last) / cycleMs);
        phaseRef.current = next;
        setPhase(next);
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cycleMs, held, reduceMotion, scrub]);

  if (held) {
    if (scrub !== undefined) return wrapPhase(scrub);
    return reduceMotion ? REDUCED_PHASE : phase;
  }
  return phase;
}
