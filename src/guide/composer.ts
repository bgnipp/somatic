import { isMuscleId, type MuscleId } from "../anatomy/catalog";
import { wrapPhase, type ActivationFn, type GuideScript } from "./script";

export type Composition = {
  engage: MuscleId[];
  release: MuscleId[];
  holdMs: number;
};

export const COMPOSITION_KEY = "somatic.composition.v1";
export const DEFAULT_HOLD_MS = 6000;
const SETTLE_AT = 0.8;
const RAMP = 0.08;

export function emptyComposition(): Composition {
  return { engage: [], release: [], holdMs: DEFAULT_HOLD_MS };
}

function uniqueValid(ids: unknown): MuscleId[] {
  if (!Array.isArray(ids)) return [];
  const out: MuscleId[] = [];
  for (const id of ids) {
    if (typeof id === "string" && isMuscleId(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function loadComposition(): Composition {
  try {
    const raw = localStorage.getItem(COMPOSITION_KEY);
    if (!raw) return emptyComposition();
    const parsed = JSON.parse(raw) as Partial<Composition>;
    const holdMs =
      typeof parsed.holdMs === "number" && parsed.holdMs >= 2000 && parsed.holdMs <= 20000
        ? parsed.holdMs
        : DEFAULT_HOLD_MS;
    return {
      engage: uniqueValid(parsed.engage),
      release: uniqueValid(parsed.release).filter((id) => !uniqueValid(parsed.engage).includes(id)),
      holdMs,
    };
  } catch {
    return emptyComposition();
  }
}

export function saveComposition(c: Composition): void {
  try {
    localStorage.setItem(COMPOSITION_KEY, JSON.stringify(c));
  } catch {
    /* ignore quota / private mode */
  }
}

function staggerFor(count: number): number {
  if (count <= 1) return 0;
  return Math.min(0.08, 0.5 / count);
}

/** sign is +1 (engage) or −1 (release). Holds after the ramp, eases out after SETTLE_AT. */
function orderedCurve(index: number, stagger: number, sign: 1 | -1): ActivationFn {
  return (phase) => {
    const p = wrapPhase(phase);
    const onset = index * stagger;
    let value = 0;
    if (p < onset) {
      value = 0;
    } else if (p < onset + RAMP) {
      const u = (p - onset) / RAMP;
      value = 0.5 - 0.5 * Math.cos(u * Math.PI);
    } else {
      value = 1;
    }
    if (p >= SETTLE_AT) {
      const t = (p - SETTLE_AT) / (1 - SETTLE_AT);
      value *= 0.5 + 0.5 * Math.cos(t * Math.PI);
    }
    return sign * value;
  };
}

function sampleFn(fn: ActivationFn | undefined, phase: number): number {
  return fn ? fn(phase) : 0;
}

export function compileComposition(c: Composition): GuideScript {
  const engage = uniqueValid(c.engage);
  const release = uniqueValid(c.release).filter((id) => !engage.includes(id));
  const n = Math.max(engage.length, release.length, 1);
  const stagger = staggerFor(n);
  const activations: Partial<Record<MuscleId, ActivationFn>> = {};
  engage.forEach((id, i) => {
    activations[id] = orderedCurve(i, stagger, 1);
  });
  release.forEach((id, i) => {
    activations[id] = orderedCurve(i, stagger, -1);
  });

  const dia = activations.diaphragm;
  const ribSrc = activations.intercostals ?? activations.levatores_costarum;
  const pf = activations.pelvic_floor;
  const pfEngaged = engage.includes("pelvic_floor");
  const pfReleased = release.includes("pelvic_floor");

  return {
    id: "custom",
    label: "Composed",
    blurb: "Your selection — muscles light in the order chosen.",
    cycleMs: c.holdMs || DEFAULT_HOLD_MS,
    inhaleFraction: 0.5,
    activations,
    diaphragmFlatten: (phase) => Math.max(0, sampleFn(dia, phase)),
    ribExpand: (phase) => Math.max(0, sampleFn(ribSrc, phase)) * 0.8,
    pelvicLift: (phase) => {
      if (pfEngaged) return Math.max(0, sampleFn(pf, phase));
      if (pfReleased) return Math.min(0, sampleFn(pf, phase));
      return 0;
    },
    spineFlex: () => 0,
    ribLift: () => 0,
    sternumLift: () => 0,
  };
}

