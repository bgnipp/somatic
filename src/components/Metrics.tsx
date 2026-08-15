import { useRef } from "react";
import { computeMetrics, type BreathMetrics } from "../lib/metrics";
import type { Sample } from "../types";

type Props = {
  samples: Sample[];
};

type Pair = { a: number; b: number };

function fmt(n: number | null, digits = 1): string {
  return n === null ? "—" : n.toFixed(digits);
}

function holdPair(prev: Pair | null, next: Pair | null): Pair | null {
  if (!next) return prev;
  if (!prev) return next;
  return Math.abs(next.a - prev.a) < 2 ? prev : next;
}

export function Metrics({ samples }: Props) {
  const held = useRef<BreathMetrics | null>(null);
  const next = computeMetrics(samples);
  const prev = held.current;
  const chestBelly = holdPair(
    prev?.chestBelly ? { a: prev.chestBelly.chest, b: prev.chestBelly.belly } : null,
    next.chestBelly ? { a: next.chestBelly.chest, b: next.chestBelly.belly } : null,
  );
  const leftRight = holdPair(
    prev?.leftRight ? { a: prev.leftRight.left, b: prev.leftRight.right } : null,
    next.leftRight ? { a: next.leftRight.left, b: next.leftRight.right } : null,
  );
  const m: BreathMetrics = {
    breathsPerMin: next.breathsPerMin ?? prev?.breathsPerMin ?? null,
    chestBelly: chestBelly ? { chest: chestBelly.a, belly: chestBelly.b } : null,
    leftRight: leftRight ? { left: leftRight.a, right: leftRight.b } : null,
    phaseDeg: next.phaseDeg ?? prev?.phaseDeg ?? null,
  };
  held.current = m;
  const phase =
    m.phaseDeg === null
      ? "—"
      : m.phaseDeg < 20
        ? "in phase"
        : `~${Math.round(m.phaseDeg)}° offset`;

  return (
    <div className="metrics">
      <div>
        <span className="metrics-label">Breaths / min</span>
        <strong>{fmt(m.breathsPerMin)}</strong>
      </div>
      <div>
        <span className="metrics-label">Chest : belly</span>
        <strong>
          {m.chestBelly ? `${m.chestBelly.chest} : ${m.chestBelly.belly}` : "—"}
        </strong>
      </div>
      <div>
        <span className="metrics-label">Left : right</span>
        <strong>
          {m.leftRight ? `${m.leftRight.left} : ${m.leftRight.right}` : "—"}
        </strong>
      </div>
      <div>
        <span className="metrics-label">Phase</span>
        <strong>{phase}</strong>
      </div>
    </div>
  );
}
