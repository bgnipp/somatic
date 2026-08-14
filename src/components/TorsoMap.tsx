import { useState } from "react";
import { motionFill, motionStroke } from "../lib/color";
import { meanAbdomen, meanRibCage } from "../mock/synthesize";
import type { CompartmentId, Sample } from "../types";
import { COMPARTMENT_LABELS, LANDMARKS } from "../types";

/**
 * Standing front view, head through the hip crop.
 * One head ≈ 40px, short neck, shoulders ≈ 2.3 head-widths,
 * arms hang to the hips. Compartments are clipped to the torso
 * silhouette so fills can never spill outside the body.
 */
const PATHS: Record<CompartmentId, string> = {
  rc_pulmonary_L:
    "M120 66 C108 66 98 70 90 78 C84 86 82 96 82 108 C82 116 83 122 86 126 L120 126 Z",
  rc_pulmonary_R:
    "M120 66 C132 66 142 70 150 78 C156 86 158 96 158 108 C158 116 157 122 154 126 L120 126 Z",
  rc_abdominal_L:
    "M86 126 C85 136 86 146 90 154 C96 164 108 168 120 152 L120 126 Z",
  rc_abdominal_R:
    "M154 126 C155 136 154 146 150 154 C144 164 132 168 120 152 L120 126 Z",
  abdomen_L:
    "M120 152 C108 168 98 172 94 176 C94 188 96 198 100 208 C106 214 114 217 120 217 Z",
  abdomen_R:
    "M120 152 C132 168 142 172 146 176 C146 188 144 198 140 208 C134 214 126 217 120 217 Z",
};

const TORSO =
  "M111 58 C106 61 98 64 90 68 C86 72 84 76 84 80 C84 96 84 114 88 132 C92 150 98 166 104 180 C102 192 100 204 104 214 C110 220 114 222 120 222 C126 222 130 220 136 214 C140 204 138 192 136 180 C142 166 148 150 152 132 C156 114 156 96 156 80 C156 76 154 72 150 68 C142 64 134 61 129 58 Z";

const LEFT_ARM =
  "M84 70 C76 78 70 98 64 120 C58 142 56 150 60 154 C64 172 68 190 74 206 C76 212 82 212 83 206 C80 188 76 170 78 154 C80 140 82 118 86 96 C87 82 88 74 84 70 Z";
const RIGHT_ARM =
  "M156 70 C164 78 170 98 176 120 C182 142 184 150 180 154 C176 172 172 190 166 206 C164 212 158 212 157 206 C160 188 164 170 162 154 C160 140 158 118 154 96 C153 82 152 74 156 70 Z";

const CLAVICLE_L = "M120 66 C110 66 100 68 90 74";
const CLAVICLE_R = "M120 66 C130 66 140 68 150 74";
const COSTAL_ARCH = "M94 176 C106 166 114 156 120 152 C126 156 134 166 146 176";

type Props = {
  sample: Sample | null;
  showLandmarks: boolean;
};

export function TorsoMap({ sample, showLandmarks }: Props) {
  const [hover, setHover] = useState<CompartmentId | null>(null);
  const ceiling = 12;
  const total = sample ? meanRibCage(sample) + meanAbdomen(sample) : 0;
  const scale = 1 + Math.min(total, 22) * 0.0012;

  return (
    <div className="torso-wrap">
      <svg
        viewBox="0 0 240 250"
        className="torso-svg"
        role="img"
        aria-label="Front torso motion map"
      >
        <defs>
          <clipPath id="torso-clip">
            <path d={TORSO} />
          </clipPath>
        </defs>
        <ellipse className="torso-context" cx="120" cy="30" rx="17" ry="20" />
        <path
          className="torso-neck"
          d="M111 46 L110 58 L130 58 L129 46 C126 50 123 52 120 52 C117 52 114 50 111 46 Z"
        />
        <g
          className="torso-breathe"
          style={{ transform: `scale(${scale})`, transformOrigin: "120px 96px" }}
        >
        <path className="torso-limb" d={LEFT_ARM} />
        <path className="torso-limb" d={RIGHT_ARM} />
        <path className="torso-context" d={TORSO} />
        <g clipPath="url(#torso-clip)">
          {(Object.keys(PATHS) as CompartmentId[]).map((id) => {
            const mm = sample?.compartments[id].displacementMm ?? 0;
            return (
              <path
                key={id}
                d={PATHS[id]}
                fill={motionFill(mm, ceiling)}
                stroke={motionStroke(mm, ceiling)}
                strokeWidth={hover === id ? 1.6 : 0.75}
                className="compartment"
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
          <path className="bone-line" d={CLAVICLE_L} />
          <path className="bone-line" d={CLAVICLE_R} />
          <path className="bone-line" d={COSTAL_ARCH} />
          <line x1="120" y1="66" x2="120" y2="217" className="midline" />
        </g>
        </g>
        {showLandmarks &&
          LANDMARKS.map((mark) => (
            <g key={mark.id} className="landmark">
              <circle cx={mark.x} cy={mark.y} r="2.1" />
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
