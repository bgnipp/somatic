import type { CompartmentId, PresetId, Sample } from "../types";
import { COMPARTMENT_IDS } from "../types";

const QUIET_PERIOD_MS = 4600;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function raisedSine(tMs: number, periodMs: number, phaseRad: number): number {
  return 0.5 + 0.5 * Math.sin((2 * Math.PI * tMs) / periodMs + phaseRad - Math.PI / 2);
}

function jitter(amp: number): number {
  return (Math.random() - 0.5) * 2 * amp;
}

function emptyCompartments(): Sample["compartments"] {
  return Object.fromEntries(
    COMPARTMENT_IDS.map((id) => [id, { displacementMm: 0 }]),
  ) as Sample["compartments"];
}

function lateralsFrom(
  values: Record<CompartmentId, number>,
  extraLeft = 1,
  extraRight = 1,
): { leftMm: number; rightMm: number } {
  return {
    leftMm: clamp(values.rc_abdominal_L * 0.55 + extraLeft, 0, 20),
    rightMm: clamp(values.rc_abdominal_R * 0.55 + extraRight, 0, 20),
  };
}

function apply(
  t: number,
  values: Record<CompartmentId, number>,
  noiseMm = 0.18,
  lateralScale: { left: number; right: number } = { left: 1, right: 1 },
): Sample {
  const compartments = emptyCompartments();
  for (const id of COMPARTMENT_IDS) {
    compartments[id] = {
      displacementMm: clamp(values[id] + jitter(noiseMm), 0, 28),
    };
  }
  return {
    t,
    compartments,
    lateral: lateralsFrom(
      values,
      0.8 * lateralScale.left,
      0.8 * lateralScale.right,
    ),
  };
}

function quietCycle(
  t: number,
  amps: Record<CompartmentId, number>,
  phases: Partial<Record<CompartmentId, number>> = {},
  lateralScale: { left: number; right: number } = { left: 1, right: 1 },
): Sample {
  const values = {} as Record<CompartmentId, number>;
  for (const id of COMPARTMENT_IDS) {
    const w = raisedSine(t, QUIET_PERIOD_MS, phases[id] ?? 0);
    values[id] = 0.35 + amps[id] * w;
  }
  return apply(t, values, 0.18, lateralScale);
}

function phraseEnvelope(t: number, phraseMs: number): { inhale: number; exhale: number; phase: number } {
  const phase = (t % phraseMs) / phraseMs;
  if (phase < 0.22) {
    return { inhale: phase / 0.22, exhale: 0, phase };
  }
  return { inhale: 1, exhale: (phase - 0.22) / 0.78, phase };
}

export function synthesize(t: number, preset: PresetId): Sample {
  switch (preset) {
    case "abdominal":
      return quietCycle(t, {
        rc_pulmonary_L: 2.4,
        rc_pulmonary_R: 2.5,
        rc_abdominal_L: 4.2,
        rc_abdominal_R: 4.4,
        abdomen_L: 9.2,
        abdomen_R: 9.4,
      });

    case "apical":
      return quietCycle(t, {
        rc_pulmonary_L: 8.6,
        rc_pulmonary_R: 8.8,
        rc_abdominal_L: 3.1,
        rc_abdominal_R: 3.2,
        abdomen_L: 1.6,
        abdomen_R: 1.7,
      });

    case "left_quiet":
      return quietCycle(
        t,
        {
          rc_pulmonary_L: 4.0,
          rc_pulmonary_R: 5.2,
          rc_abdominal_L: 2.4,
          rc_abdominal_R: 6.2,
          abdomen_L: 5.0,
          abdomen_R: 8.4,
        },
        {},
        { left: 0.45, right: 1.15 },
      );

    case "asynchrony":
      return quietCycle(
        t,
        {
          rc_pulmonary_L: 6.4,
          rc_pulmonary_R: 6.6,
          rc_abdominal_L: 5.8,
          rc_abdominal_R: 6.0,
          abdomen_L: 8.2,
          abdomen_R: 8.4,
        },
        {
          abdomen_L: Math.PI / 2,
          abdomen_R: Math.PI / 2,
        },
      );

    case "frozen":
      return quietCycle(t, {
        rc_pulmonary_L: 5.2,
        rc_pulmonary_R: 5.4,
        rc_abdominal_L: 0.35,
        rc_abdominal_R: 6.0,
        abdomen_L: 7.4,
        abdomen_R: 8.0,
      });

    case "clavicular": {
      const period = 3800;
      const w = raisedSine(t, period, 0);
      const sharp = Math.pow(w, 0.45);
      return apply(t, {
        rc_pulmonary_L: 0.4 + 16.5 * sharp,
        rc_pulmonary_R: 0.4 + 16.8 * sharp,
        rc_abdominal_L: 0.4 + 3.2 * w,
        rc_abdominal_R: 0.4 + 3.3 * w,
        abdomen_L: 0.4 + 2.1 * w,
        abdomen_R: 0.4 + 2.2 * w,
      });
    }

    case "rib_collapse": {
      const { inhale, exhale } = phraseEnvelope(t, 8200);
      const ribPeak = 17.5;
      const rib = inhale < 1 ? 3 + (ribPeak - 3) * inhale : ribPeak - (ribPeak - 5.5) * exhale;
      const belly = inhale < 1 ? 2 + 6 * inhale : 8 - 2.2 * exhale + 1.4 * Math.sin(exhale * Math.PI);
      return apply(t, {
        rc_pulmonary_L: rib * 0.72,
        rc_pulmonary_R: rib * 0.74,
        rc_abdominal_L: rib,
        rc_abdominal_R: rib * 1.02,
        abdomen_L: belly,
        abdomen_R: belly * 1.04,
      });
    }
  }
}

export function meanRibCage(sample: Sample): number {
  const c = sample.compartments;
  return (
    (c.rc_pulmonary_L.displacementMm +
      c.rc_pulmonary_R.displacementMm +
      c.rc_abdominal_L.displacementMm +
      c.rc_abdominal_R.displacementMm) /
    4
  );
}

export function meanAbdomen(sample: Sample): number {
  const c = sample.compartments;
  return (c.abdomen_L.displacementMm + c.abdomen_R.displacementMm) / 2;
}

export function meanLeft(sample: Sample): number {
  const c = sample.compartments;
  return (
    (c.rc_pulmonary_L.displacementMm +
      c.rc_abdominal_L.displacementMm +
      c.abdomen_L.displacementMm) /
    3
  );
}

export function meanRight(sample: Sample): number {
  const c = sample.compartments;
  return (
    (c.rc_pulmonary_R.displacementMm +
      c.rc_abdominal_R.displacementMm +
      c.abdomen_R.displacementMm) /
    3
  );
}

export function sampleAt(samples: Sample[], t: number): Sample | null {
  if (samples.length === 0) return null;
  if (t <= samples[0].t) return samples[0];
  const last = samples[samples.length - 1];
  if (t >= last.t) return last;

  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const span = b.t - a.t || 1;
  const u = (t - a.t) / span;
  const compartments = emptyCompartments();
  for (const id of COMPARTMENT_IDS) {
    compartments[id] = {
      displacementMm:
        a.compartments[id].displacementMm * (1 - u) +
        b.compartments[id].displacementMm * u,
    };
  }
  const lateral =
    a.lateral && b.lateral
      ? {
          leftMm: a.lateral.leftMm * (1 - u) + b.lateral.leftMm * u,
          rightMm: a.lateral.rightMm * (1 - u) + b.lateral.rightMm * u,
        }
      : a.lateral ?? b.lateral;
  return { t, compartments, lateral };
}
