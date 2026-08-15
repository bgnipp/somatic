export type GuideStructureId =
  | "pelvic_floor"
  | "diaphragm"
  | "transversus"
  | "rectus"
  | "obliques"
  | "intercostals"
  | "scalenes"
  | "traps";

export const GUIDE_STRUCTURE_IDS: GuideStructureId[] = [
  "pelvic_floor",
  "diaphragm",
  "transversus",
  "rectus",
  "obliques",
  "intercostals",
  "scalenes",
  "traps",
];

/**
 * Activation at a phase point. Range [-1, 1]:
 *   +1 fully contracting (red), -1 fully relaxing/lengthening (blue),
 *   0 neutral. Tonic structures hover at a small positive constant.
 */
export type ActivationFn = (phase: number) => number;

export type GuideScriptId = "quiet" | "supported";

export type GuideScript = {
  id: GuideScriptId;
  label: string;
  blurb: string;
  cycleMs: number;
  inhaleFraction: number;
  activations: Record<GuideStructureId, ActivationFn>;
  diaphragmFlatten: (phase: number) => number;
  ribExpand: (phase: number) => number;
  pelvicLift: (phase: number) => number;
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

function sampleActivations(
  activations: Record<GuideStructureId, ActivationFn>,
  phase: number,
): Record<GuideStructureId, number> {
  const out = {} as Record<GuideStructureId, number>;
  for (const id of GUIDE_STRUCTURE_IDS) {
    out[id] = activations[id](phase);
  }
  return out;
}

export function activationsAt(
  script: GuideScript,
  phase: number,
): Record<GuideStructureId, number> {
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
    rectus: constant(0),
    obliques: constant(0),
    intercostals: (phase) => inhaleWave(phase, quietInhale) * 0.4,
    scalenes: (phase) => inhaleWave(phase, quietInhale) * 0.08,
    traps: constant(0),
  },
  diaphragmFlatten: (phase) => inhaleWave(phase, quietInhale) * 0.7,
  ribExpand: (phase) => inhaleWave(phase, quietInhale) * 0.6,
  pelvicLift: (phase) => -inhaleWave(phase, quietInhale) * 0.55,
};

export const GUIDE_SCRIPTS: GuideScript[] = [quiet, supported];

export function scriptById(id: GuideScriptId): GuideScript {
  return GUIDE_SCRIPTS.find((s) => s.id === id) ?? supported;
}

export function loadStoredScript(): GuideScriptId {
  try {
    const raw = localStorage.getItem(GUIDE_SCRIPT_KEY);
    return raw === "quiet" || raw === "supported" ? raw : DEFAULT_GUIDE_SCRIPT;
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
