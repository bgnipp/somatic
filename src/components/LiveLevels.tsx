import { motionSolid } from "../lib/color";
import type { Sample } from "../types";
import { COMPARTMENT_IDS, COMPARTMENT_LABELS } from "../types";

type Props = {
  sample: Sample | null;
};

const CEILING = 18;

export function LiveLevels({ sample }: Props) {
  if (!sample) return null;
  return (
    <div className="chart-block">
      <header className="chart-head">
        <h3>Regions now</h3>
        <span className="muted">mm from rest</span>
      </header>
      <ul className="levels">
        {COMPARTMENT_IDS.map((id) => {
          const mm = sample.compartments[id].displacementMm;
          const pct = Math.min(100, (mm / CEILING) * 100);
          return (
            <li key={id}>
              <span className="level-label">{COMPARTMENT_LABELS[id]}</span>
              <span className="level-bar">
                <i style={{ width: `${pct}%`, background: motionSolid(mm, 12) }} />
              </span>
              <span className="level-value">{mm.toFixed(1)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
