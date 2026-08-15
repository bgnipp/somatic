import { useEffect, useRef, useState } from "react";
import { wrapPhase } from "./script";

const REDUCED_PHASE = 0.2;

/**
 * Incremental phase clock. Advances by dt / cycleMs so switching scripts
 * changes speed without jumping the phase. Frozen at mid-inhale under
 * reduced motion; `paused` holds the current (or scrubbed) phase.
 */
export function useGuideClock(
  cycleMs: number,
  options: { reduceMotion: boolean; paused?: boolean; scrub?: number },
): number {
  const { reduceMotion, paused = false, scrub } = options;
  const [phase, setPhase] = useState(reduceMotion ? REDUCED_PHASE : 0);
  const phaseRef = useRef(phase);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      phaseRef.current = REDUCED_PHASE;
      setPhase(REDUCED_PHASE);
      lastRef.current = null;
      return;
    }
    if (paused) {
      lastRef.current = null;
      if (scrub !== undefined) {
        const next = wrapPhase(scrub);
        phaseRef.current = next;
        setPhase(next);
      }
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
  }, [cycleMs, reduceMotion, paused, scrub]);

  if (reduceMotion) return REDUCED_PHASE;
  if (paused && scrub !== undefined) return wrapPhase(scrub);
  return phase;
}
