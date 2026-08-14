import { motionFill } from "../lib/color";
import type { Sample } from "../types";

type Props = {
  sample: Sample | null;
};

export function CrossSection({ sample }: Props) {
  const c = sample?.compartments;
  const anterior = c
    ? (c.rc_pulmonary_L.displacementMm + c.rc_pulmonary_R.displacementMm) / 2
    : 0;
  const left = c ? c.rc_abdominal_L.displacementMm : 0;
  const right = c ? c.rc_abdominal_R.displacementMm : 0;
  const posterior = c
    ? (c.rc_abdominal_L.displacementMm + c.rc_abdominal_R.displacementMm) * 0.45
    : 0;

  const ax = 18 + anterior * 1.6;
  const px = 18 + posterior * 1.6;
  const ly = 16 + left * 1.5;
  const ry = 16 + right * 1.5;

  return (
    <div className="section-wrap">
      <svg viewBox="0 0 160 120" className="section-svg" aria-label="Thorax cross-section">
        <ellipse cx="80" cy="60" rx="46" ry="32" className="section-rest" />
        <ellipse
          cx="80"
          cy="60"
          rx={46 + (ax + px) / 6}
          ry={32 + (ly + ry) / 6}
          fill={motionFill((anterior + left + right) / 3, 14)}
          opacity="0.85"
          stroke="rgba(228,184,106,0.45)"
        />
        <text x="80" y="16" textAnchor="middle" className="section-label">
          front
        </text>
        <text x="80" y="110" textAnchor="middle" className="section-label">
          back
        </text>
        <text x="14" y="64" textAnchor="middle" className="section-label">
          L
        </text>
        <text x="146" y="64" textAnchor="middle" className="section-label">
          R
        </text>
      </svg>
      <div className="torso-caption">
        <strong>Mid-thorax section</strong>
        <span>Lateral and back expansion have somewhere to go.</span>
      </div>
    </div>
  );
}
