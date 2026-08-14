import { meanAbdomen, meanRibCage } from "../mock/synthesize";
import type { Sample } from "../types";

type Props = {
  history: Sample[];
};

const S = 160;
const PAD = 22;
const MAX = 18;

export function KonnoMead({ history }: Props) {
  const pts = history.map((s) => ({
    x: meanRibCage(s),
    y: meanAbdomen(s),
  }));
  const toX = (v: number) => PAD + (Math.min(v, MAX) / MAX) * (S - PAD * 2);
  const toY = (v: number) => S - PAD - (Math.min(v, MAX) / MAX) * (S - PAD * 2);
  const toPoint = (p: { x: number; y: number }) =>
    `${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`;
  const split = Math.max(0, pts.length - 90);
  const older = pts.slice(0, split + 1).map(toPoint).join(" ");
  const recent = pts.slice(split).map(toPoint).join(" ");
  const last = pts[pts.length - 1];

  return (
    <div className="chart-block">
      <header className="chart-head">
        <h3>Konno–Mead</h3>
        <span className="muted">Rib cage × abdomen</span>
      </header>
      <svg viewBox={`0 0 ${S} ${S}`} className="chart-svg square" aria-label="Konno-Mead loop">
        <line x1={PAD} y1={S - PAD} x2={S - PAD} y2={S - PAD} className="axis" />
        <line x1={PAD} y1={S - PAD} x2={PAD} y2={PAD} className="axis" />
        <text x={S / 2} y={S - 6} textAnchor="middle" className="axis-label">
          rib cage
        </text>
        <text
          x="10"
          y={S / 2}
          textAnchor="middle"
          className="axis-label"
          transform={`rotate(-90 10 ${S / 2})`}
        >
          abdomen
        </text>
        {older && pts.length > 2 && <polyline points={older} className="trace loop old" />}
        {recent && <polyline points={recent} className="trace loop" />}
        {last && <circle cx={toX(last.x)} cy={toY(last.y)} r="3.2" className="loop-now" />}
      </svg>
      <p className="chart-foot">Loop shape is phase. Not scored as good or bad.</p>
    </div>
  );
}
