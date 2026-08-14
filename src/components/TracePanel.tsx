import { meanAbdomen, meanLeft, meanRight, meanRibCage } from "../mock/synthesize";
import type { Sample } from "../types";

type Props = {
  history: Sample[];
  compare?: Sample[];
  labels?: { a?: string; b?: string };
};

const W = 320;
const H = 120;
const PAD = 8;

function polylineTimed(
  samples: Sample[],
  pick: (s: Sample) => number,
  t0: number,
  t1: number,
  max = 18,
): string {
  if (samples.length < 2) return "";
  const span = t1 - t0 || 1;
  return samples
    .map((s) => {
      const x = PAD + ((s.t - t0) / span) * (W - PAD * 2);
      const y = H - PAD - (Math.min(pick(s), max) / max) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function TracePanel({ history, compare = [], labels }: Props) {
  const t0 = history[0]?.t ?? 0;
  const t1 = history[history.length - 1]?.t ?? 1;
  const hasCompare = compare.length > 1;

  return (
    <div className="chart-block">
      <header className="chart-head">
        <h3>Traces</h3>
        <ul className="legend">
          <li><i className="swatch rib" /> Rib cage</li>
          <li><i className="swatch belly" /> Abdomen</li>
          <li><i className="swatch left" /> Left</li>
          <li><i className="swatch right" /> Right</li>
          {hasCompare && <li><i className="swatch compare" /> B</li>}
        </ul>
      </header>
      {hasCompare && (
        <p className="compare-labels">
          <span>A · {labels?.a ?? "this take"}</span>
          <span>B · {labels?.b ?? "compare"}</span>
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" aria-label="Displacement traces">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="axis" />
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="gridline" />
        <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} className="gridline" />
        <text x={W - PAD} y={PAD - 2} textAnchor="end" className="axis-label trace-max">
          18 mm
        </text>
        {hasCompare && (
          <>
            <polyline points={polylineTimed(compare, meanRibCage, t0, t1)} className="trace rib compare" />
            <polyline points={polylineTimed(compare, meanAbdomen, t0, t1)} className="trace belly compare" />
          </>
        )}
        <polyline points={polylineTimed(history, meanRibCage, t0, t1)} className="trace rib" />
        <polyline points={polylineTimed(history, meanAbdomen, t0, t1)} className="trace belly" />
        <polyline points={polylineTimed(history, meanLeft, t0, t1)} className="trace left" />
        <polyline points={polylineTimed(history, meanRight, t0, t1)} className="trace right" />
      </svg>
      <p className="chart-foot">Last ~8 s · displacement from rest (mm)</p>
    </div>
  );
}
