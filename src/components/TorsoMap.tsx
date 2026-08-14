import { useState } from "react";
import { motionFill, motionStroke } from "../lib/color";
import type { CompartmentId, Sample } from "../types";
import { COMPARTMENT_LABELS, LANDMARKS } from "../types";

const PATHS: Record<CompartmentId, string> = {
  rc_pulmonary_L:
    "M120 50 C96 50 74 54 58 68 C46 82 44 104 48 128 L120 128 Z",
  rc_pulmonary_R:
    "M120 50 C144 50 166 54 182 68 C194 82 196 104 192 128 L120 128 Z",
  rc_abdominal_L:
    "M48 128 C46 156 50 184 62 208 L120 208 L120 128 Z",
  rc_abdominal_R:
    "M192 128 C194 156 190 184 178 208 L120 208 L120 128 Z",
  abdomen_L:
    "M62 208 C64 248 72 292 86 328 L120 322 L120 208 Z",
  abdomen_R:
    "M178 208 C176 248 168 292 154 328 L120 322 L120 208 Z",
};

type Props = {
  sample: Sample | null;
  showLandmarks: boolean;
};

export function TorsoMap({ sample, showLandmarks }: Props) {
  const [hover, setHover] = useState<CompartmentId | null>(null);
  const ceiling = 12;

  return (
    <div className="torso-wrap">
      <svg viewBox="0 0 240 360" className="torso-svg" role="img" aria-label="Front torso motion map">
        <path
          className="torso-context"
          d="M120 18 C112 18 108 28 108 36 L106 46 C78 48 52 62 42 92 C30 128 32 200 48 268 C58 312 78 342 120 348 C162 342 182 312 192 268 C208 200 210 128 198 92 C188 62 162 48 134 46 L132 36 C132 28 128 18 120 18 Z"
        />
        {(Object.keys(PATHS) as CompartmentId[]).map((id) => {
          const mm = sample?.compartments[id].displacementMm ?? 0;
          return (
            <path
              key={id}
              d={PATHS[id]}
              fill={motionFill(mm, ceiling)}
              stroke={motionStroke(mm, ceiling)}
              strokeWidth={hover === id ? 1.6 : 0.8}
              className="compartment"
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
        <line x1="120" y1="50" x2="120" y2="322" className="midline" />
        {showLandmarks &&
          LANDMARKS.map((mark) => (
            <g key={mark.id} className="landmark">
              <circle cx={mark.x} cy={mark.y} r="2.6" />
              <title>{mark.label}</title>
            </g>
          ))}
      </svg>
      <div className="torso-caption">
        {hover && sample ? (
          <>
            <strong>{COMPARTMENT_LABELS[hover]}</strong>
            <span>{sample.compartments[hover].displacementMm.toFixed(1)} mm from rest</span>
          </>
        ) : (
          <>
            <strong>Front view</strong>
            <span>Brighter is more motion. Not a problem map.</span>
          </>
        )}
      </div>
    </div>
  );
}
