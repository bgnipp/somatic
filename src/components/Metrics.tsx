import { computeMetrics } from "../lib/metrics";
import type { Sample } from "../types";

type Props = {
  samples: Sample[];
};

function fmt(n: number | null, digits = 1): string {
  return n === null ? "—" : n.toFixed(digits);
}

export function Metrics({ samples }: Props) {
  const m = computeMetrics(samples);
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
