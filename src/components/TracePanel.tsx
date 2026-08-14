import { meanAbdomen, meanLeft, meanRight, meanRibCage } from "../mock/synthesize";
import type { Sample } from "../types";

type Props = {
  history: Sample[];
};

const W = 320;
const H = 120;
const PAD = 8;

function polyline(values: number[], max = 18): string {
  if (values.length < 2) return "";
  const n = values.length;
  return values
    .map((v, i) => {
      const x = PAD + (i / (n - 1)) * (W - PAD * 2);
      const y = H - PAD - (Math.min(v, max) / max) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function TracePanel({ history }: Props) {
  const rib = history.map(meanRibCage);
  const belly = history.map(meanAbdomen);
  const left = history.map(meanLeft);
  const right = history.map(meanRight);

  return (
    <div className="chart-block">
      <header className="chart-head">
        <h3>Traces</h3>
        <ul className="legend">
          <li><i className="swatch rib" /> Rib cage</li>
          <li><i className="swatch belly" /> Abdomen</li>
          <li><i className="swatch left" /> Left</li>
          <li><i className="swatch right" /> Right</li>
        </ul>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" aria-label="Displacement traces">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="axis" />
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="gridline" />
        <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} className="gridline" />
        <text x={W - PAD} y={PAD - 2} textAnchor="end" className="axis-label trace-max">
          18 mm
        </text>
        <polyline points={polyline(rib)} className="trace rib" />
        <polyline points={polyline(belly)} className="trace belly" />
        <polyline points={polyline(left)} className="trace left" />
        <polyline points={polyline(right)} className="trace right" />
      </svg>
      <p className="chart-foot">Last ~8 s · displacement from rest (mm)</p>
    </div>
  );
}
