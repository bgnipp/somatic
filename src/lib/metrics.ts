import { meanAbdomen, meanLeft, meanRight, meanRibCage } from "../mock/synthesize";
import type { Sample } from "../types";

const MIN_WINDOW_MS = 8000;
const MIN_PROMINENCE = 1;
const MIN_PEAK_GAP_MS = 1500;

export type BreathMetrics = {
  breathsPerMin: number | null;
  chestBelly: { chest: number; belly: number } | null;
  leftRight: { left: number; right: number } | null;
  phaseDeg: number | null;
};

function spanMs(samples: Sample[]): number {
  if (samples.length < 2) return 0;
  return samples[samples.length - 1].t - samples[0].t;
}

function excursion(values: number[]): number {
  if (values.length === 0) return 0;
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

function pairShare(a: number, b: number): { a: number; b: number } | null {
  const sum = a + b;
  if (sum < 0.4) return null;
  return {
    a: Math.round((a / sum) * 100),
    b: Math.round((b / sum) * 100),
  };
}

function peakTimes(values: number[], times: number[]): number[] {
  const radius = 20;
  const peaks: number[] = [];
  for (let i = radius; i < values.length - radius; i++) {
    let isMax = true;
    for (let j = i - radius; j <= i + radius; j++) {
      if (values[j] > values[i]) {
        isMax = false;
        break;
      }
    }
    if (!isMax) continue;
    let nearbyMin = values[i];
    for (let j = i - radius * 2; j <= i + radius * 2; j++) {
      if (j >= 0 && j < values.length) nearbyMin = Math.min(nearbyMin, values[j]);
    }
    if (values[i] - nearbyMin < MIN_PROMINENCE) continue;
    const last = peaks[peaks.length - 1];
    if (last !== undefined && times[i] - last < MIN_PEAK_GAP_MS) continue;
    peaks.push(times[i]);
  }
  return peaks;
}

function dominantPeriodMs(samples: Sample[], totals: number[]): number {
  const peaks = peakTimes(totals, samples.map((s) => s.t));
  if (peaks.length >= 2) {
    return (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
  }
  return 4600;
}

function phaseOffsetDeg(
  rib: number[],
  belly: number[],
  times: number[],
  periodMs: number,
): number | null {
  if (periodMs <= 0 || excursion(rib) < 1.5 || excursion(belly) < 1.5) return null;
  const ribPeaks = peakTimes(rib, times);
  const bellyPeaks = peakTimes(belly, times);
  if (ribPeaks.length === 0 || bellyPeaks.length === 0) return null;
  const lags: number[] = [];
  for (const t of ribPeaks) {
    let nearest = bellyPeaks[0];
    for (const u of bellyPeaks) {
      if (Math.abs(u - t) < Math.abs(nearest - t)) nearest = u;
    }
    lags.push(nearest - t);
  }
  const meanLag = lags.reduce((sum, x) => sum + x, 0) / lags.length;
  return Math.min(180, (Math.abs(meanLag) / periodMs) * 360);
}

export function computeMetrics(samples: Sample[]): BreathMetrics {
  if (spanMs(samples) < MIN_WINDOW_MS) {
    return { breathsPerMin: null, chestBelly: null, leftRight: null, phaseDeg: null };
  }

  const times = samples.map((s) => s.t);
  const totals = samples.map((s) => meanRibCage(s) + meanAbdomen(s));
  const rib = samples.map(meanRibCage);
  const belly = samples.map(meanAbdomen);
  const left = samples.map(meanLeft);
  const right = samples.map(meanRight);

  const peaks = peakTimes(totals, times);
  let breathsPerMin: number | null = null;
  if (peaks.length >= 2) {
    const minutes = (peaks[peaks.length - 1] - peaks[0]) / 60000;
    breathsPerMin = minutes > 0 ? (peaks.length - 1) / minutes : null;
  }

  const cb = pairShare(excursion(rib), excursion(belly));
  const lr = pairShare(excursion(left), excursion(right));
  const period = dominantPeriodMs(samples, totals);
  const phaseDeg = phaseOffsetDeg(rib, belly, times, period);

  return {
    breathsPerMin,
    chestBelly: cb ? { chest: cb.a, belly: cb.b } : null,
    leftRight: lr ? { left: lr.a, right: lr.b } : null,
    phaseDeg,
  };
}
