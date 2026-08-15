import { MUSCLE_IDS, type MuscleId } from "../anatomy/catalog";

export type GuideStructureId = MuscleId;
export const GUIDE_STRUCTURE_IDS = MUSCLE_IDS;

/**
 * Activation at a phase point. Range [-1, 1]:
 *   +1 fully contracting (red), -1 fully relaxing/lengthening (blue),
 *   0 neutral. Tonic structures hover at a small positive constant.
 */
export type ActivationFn = (phase: number) => number;

export type GuideScriptId = "quiet" | "supported" | "lengthen" | "custom";

export type GuideScript = {
  id: GuideScriptId;
  label: string;
  blurb: string;
  cycleMs: number;
  inhaleFraction: number;
  activations: Partial<Record<MuscleId, ActivationFn>>;
  diaphragmFlatten: (phase: number) => number;
  ribExpand: (phase: number) => number;
  pelvicLift: (phase: number) => number;
  /** 0..1 sagittal spine flexion (the slight C-curve of the active exhale). */
  spineFlex: (phase: number) => number;
  /** 0..1 ribs rise away from the pelvis (rib-cage lengthening). */
  ribLift: (phase: number) => number;
  /** 0..1 upper sternum moves forward and up (sagittal; drives the side inset). */
  sternumLift: (phase: number) => number;
  /** When set, the sagittal side inset renders with this caption. */
  sideCaption?: string;
};

export const DEFAULT_GUIDE_SCRIPT: GuideScriptId = "supported";
export const GUIDE_SCRIPT_KEY = "somatic.guideScript.v1";

export function wrapPhase(phase: number): number {
  return ((phase % 1) + 1) % 1;
}

/** Pure clock: phase in [0, 1) from a wall-clock ms and the script's cycle. */
export function guidePhase(nowMs: number, script: GuideScript): number {
  return wrapPhase(nowMs / script.cycleMs);
}

/** Half-cosine 0→1→0: peaks at the end of inhale, rest at the cycle edges. */
function inhaleWave(phase: number, inhaleFraction: number): number {
  const p = wrapPhase(phase);
  if (p < inhaleFraction) {
    return 0.5 - 0.5 * Math.cos((p / inhaleFraction) * Math.PI);
  }
  const t = (p - inhaleFraction) / (1 - inhaleFraction);
  return 0.5 + 0.5 * Math.cos(t * Math.PI);
}

/**
 * Signed cycle: +1 at mid-inhale, −1 at mid-exhale, 0 at the transitions.
 * Continuous at the inhale/exhale boundary.
 */
function signedCycle(phase: number, inhaleFraction: number): number {
  const p = wrapPhase(phase);
  if (p < inhaleFraction) {
    return Math.sin((p / inhaleFraction) * Math.PI);
  }
  const t = (p - inhaleFraction) / (1 - inhaleFraction);
  return -Math.sin(t * Math.PI);
}

function constant(value: number): ActivationFn {
  return () => value;
}

/** Ease in, hold, release — for held coordinations rather than breath cycles. */
function holdEnvelope(phase: number): number {
  const p = wrapPhase(phase);
  if (p < 0.3) return 0.5 - 0.5 * Math.cos((p / 0.3) * Math.PI);
  if (p < 0.72) return 1;
  const t = (p - 0.72) / 0.28;
  return 0.5 + 0.5 * Math.cos(t * Math.PI);
}

function sampleActivations(
  activations: Partial<Record<MuscleId, ActivationFn>>,
  phase: number,
): Record<MuscleId, number> {
  const out = {} as Record<MuscleId, number>;
  for (const id of MUSCLE_IDS) {
    out[id] = activations[id]?.(phase) ?? 0;
  }
  return out;
}

export function activationsAt(
  script: GuideScript,
  phase: number,
): Record<MuscleId, number> {
  return sampleActivations(script.activations, wrapPhase(phase));
}

const supportedInhale = 0.4;

const supported: GuideScript = {
  id: "supported",
  label: "Supported breath",
  blurb:
    "An actively supported breath, as used in singing. Support musculature works through the exhale.",
  cycleMs: 5000,
  inhaleFraction: supportedInhale,
  activations: {
    // Leads the cycle by ~5% of phase.
    pelvic_floor: (phase) => signedCycle(phase + 0.05, supportedInhale) * 0.85,
    diaphragm: (phase) => signedCycle(phase, supportedInhale),
    transversus: constant(0.25),
    rectus: (phase) => -signedCycle(phase, supportedInhale) * 0.9,
    obliques: (phase) => -signedCycle(phase, supportedInhale) * 0.85,
    intercostals: (phase) => inhaleWave(phase, supportedInhale) * 0.8,
    scalenes: (phase) => {
      const late = signedCycle(phase - 0.08, supportedInhale);
      return late * 0.45;
    },
    traps: (phase) => {
      const p = wrapPhase(phase);
      if (p < supportedInhale) return -Math.sin((p / supportedInhale) * Math.PI) * 0.75;
      return 0;
    },
    platysma: (phase) => -inhaleWave(phase, supportedInhale) * 0.35,
    pec_minor: (phase) => inhaleWave(phase, supportedInhale) * 0.5,
    pec_major: (phase) => {
      const p = wrapPhase(phase);
      if (p < supportedInhale) return -Math.sin((p / supportedInhale) * Math.PI) * 0.6;
      return 0;
    },
    erector_iliocostalis: constant(0.15),
    erector_longissimus: constant(0.15),
    levatores_costarum: (phase) => inhaleWave(phase, supportedInhale) * 0.3,
  },
  diaphragmFlatten: (phase) => inhaleWave(phase, supportedInhale),
  /**
   * Per the physician: on the active exhale the ribs are pulled in, together,
   * and down (rectus/oblique work), dipping below rest before settling for
   * the next inhale.
   */
  ribExpand: (phase) => {
    const p = wrapPhase(phase);
    if (p < supportedInhale) {
      return 0.5 - 0.5 * Math.cos((p / supportedInhale) * Math.PI);
    }
    const t = (p - supportedInhale) / (1 - supportedInhale);
    const dip = 0.22;
    if (t < 0.75) {
      return 1 - (1 + dip) * (0.5 - 0.5 * Math.cos((t / 0.75) * Math.PI));
    }
    const u = (t - 0.75) / 0.25;
    return -dip * (0.5 + 0.5 * Math.cos(u * Math.PI));
  },
  pelvicLift: (phase) => inhaleWave(phase + 0.05, supportedInhale),
  /** Peaks mid-exhale with the rectus work — her "slight C curve of the spine." */
  spineFlex: (phase) => {
    const p = wrapPhase(phase);
    if (p < supportedInhale) return 0;
    const t = (p - supportedInhale) / (1 - supportedInhale);
    return Math.sin(t * Math.PI);
  },
  ribLift: constant(0),
  sternumLift: constant(0),
  sideCaption: "Side · the supported exhale draws a slight C-curve",
};

const quietInhale = 0.42;

const quiet: GuideScript = {
  id: "quiet",
  label: "Quiet breath",
  blurb: "Breathing at rest. The diaphragm works; the exhale is elastic recoil.",
  cycleMs: 6000,
  inhaleFraction: quietInhale,
  activations: {
    pelvic_floor: (phase) => -inhaleWave(phase, quietInhale) * 0.45,
    diaphragm: (phase) => {
      const p = wrapPhase(phase);
      if (p < quietInhale) return Math.sin((p / quietInhale) * Math.PI) * 0.85;
      const t = (p - quietInhale) / (1 - quietInhale);
      // Passive recoil: brief soft blue, then neutral.
      return -Math.sin(t * Math.PI) * 0.25 * (1 - t);
    },
    transversus: constant(0.1),
    intercostals: (phase) => inhaleWave(phase, quietInhale) * 0.4,
    scalenes: (phase) => inhaleWave(phase, quietInhale) * 0.08,
  },
  diaphragmFlatten: (phase) => inhaleWave(phase, quietInhale) * 0.7,
  ribExpand: (phase) => inhaleWave(phase, quietInhale) * 0.6,
  pelvicLift: (phase) => -inhaleWave(phase, quietInhale) * 0.55,
  spineFlex: constant(0),
  ribLift: constant(0),
  sternumLift: constant(0),
};

/**
 * The rib-geometry coordination from the "Unbunch Your Ribs" video the
 * physician endorsed: a held direction, not a breath. Upper sternum forward
 * and up, lowest ribs back and up (never dropped), lower front ribs
 * narrowing — the rib cage lengthens top to bottom. No activation tints:
 * the video is explicit that this is coordination, not muscular effort.
 */
const lengthen: GuideScript = {
  id: "lengthen",
  label: "Rib lengthening",
  blurb:
    "A coordination, not a breath. Upper sternum forward and up; lowest ribs back and up; lower front ribs narrow.",
  cycleMs: 12000,
  inhaleFraction: 0.3,
  activations: {},
  diaphragmFlatten: constant(0.3),
  /** Slightly negative: the lower front ribs narrow while the cage lifts. */
  ribExpand: (phase) => -0.18 * holdEnvelope(phase),
  pelvicLift: constant(0),
  /** Negative flex = the spine lengthens toward straight, opposite the C-curve. */
  spineFlex: (phase) => -0.5 * holdEnvelope(phase),
  ribLift: (phase) => holdEnvelope(phase),
  sternumLift: (phase) => holdEnvelope(phase),
  sideCaption: "Side · sternum forward and up, lowest ribs back and up",
};

export const GUIDE_SCRIPTS: GuideScript[] = [quiet, supported, lengthen];

export function scriptById(id: GuideScriptId): GuideScript {
  return GUIDE_SCRIPTS.find((s) => s.id === id) ?? supported;
}

export function loadStoredScript(): GuideScriptId {
  try {
    const raw = localStorage.getItem(GUIDE_SCRIPT_KEY);
    if (raw === "custom") return "custom";
    return GUIDE_SCRIPTS.some((s) => s.id === raw)
      ? (raw as GuideScriptId)
      : DEFAULT_GUIDE_SCRIPT;
  } catch {
    return DEFAULT_GUIDE_SCRIPT;
  }
}

export function saveStoredScript(id: GuideScriptId): void {
  try {
    localStorage.setItem(GUIDE_SCRIPT_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}
