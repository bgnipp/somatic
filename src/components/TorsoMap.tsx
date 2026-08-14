import { useState } from "react";
import { motionFill, motionStroke } from "../lib/color";
import type { CompartmentId, Sample } from "../types";
import { COMPARTMENT_LABELS, LANDMARKS } from "../types";

const PATHS: Record<CompartmentId, string> = {
  rc_pulmonary_L:
    "M120 108 C109 107 98 110 90 116 C83 122 80 132 80 142 C80 150 81 156 83 160 L120 160 Z",
  rc_pulmonary_R:
    "M120 108 C131 107 142 110 150 116 C157 122 160 132 160 142 C160 150 159 156 157 160 L120 160 Z",
  rc_abdominal_L:
    "M83 160 C82 170 83 180 87 188 C94 198 106 202 120 186 L120 160 Z",
  rc_abdominal_R:
    "M157 160 C158 170 157 180 153 188 C146 198 134 202 120 186 L120 160 Z",
  abdomen_L:
    "M120 186 C106 202 96 206 92 210 C92 222 96 236 102 248 C110 256 116 260 120 260 Z",
  abdomen_R:
    "M120 186 C134 202 144 206 148 210 C148 222 144 236 138 248 C130 256 124 260 120 260 Z",
};

const TORSO =
  "M112 96 C98 100 86 108 80 118 C76 128 75 140 76 152 C77 168 80 182 86 194 C92 208 100 220 106 230 C104 242 102 254 106 264 C112 272 116 276 120 276 C124 276 128 272 134 264 C138 254 136 242 134 230 C140 220 148 208 154 194 C160 182 163 168 164 152 C165 140 164 128 160 118 C154 108 142 100 128 96 Z";

const LEFT_ARM =
  "M84 116 C74 128 68 146 66 166 C65 184 68 204 72 220 C74 224 80 223 81 218 C77 200 74 182 76 166 C78 148 80 130 88 120 Z";
const RIGHT_ARM =
  "M156 116 C166 128 172 146 174 166 C175 184 172 204 168 220 C166 224 160 223 159 218 C163 200 166 182 164 166 C162 148 160 130 152 120 Z";

const CLAVICLE_L = "M120 110 C110 109 100 112 90 118";
const CLAVICLE_R = "M120 110 C130 109 140 112 150 118";
const COSTAL_ARCH = "M92 210 C104 202 114 192 120 186 C126 192 136 202 148 210";

type Props = {
  sample: Sample | null;
  showLandmarks: boolean;
};

export function TorsoMap({ sample, showLandmarks }: Props) {
  const [hover, setHover] = useState<CompartmentId | null>(null);
  const ceiling = 12;

  return (
    <div className="torso-wrap">
      <svg
        viewBox="0 0 240 320"
        className="torso-svg"
        role="img"
        aria-label="Front torso motion map"
      >
        <ellipse className="torso-context" cx="120" cy="40" rx="22" ry="28" />
        <path
          className="torso-neck"
          d="M107 62 C109 74 110 86 112 96 L128 96 C130 86 131 74 133 62 C128 70 124 74 120 74 C116 74 112 70 107 62 Z"
        />
        <path className="torso-context" d={TORSO} />
        <path className="torso-limb" d={LEFT_ARM} />
        <path className="torso-limb" d={RIGHT_ARM} />
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
        <line x1="120" y1="108" x2="120" y2="260" className="midline" />
        {showLandmarks &&
          LANDMARKS.map((mark) => (
            <g key={mark.id} className="landmark">
              <circle cx={mark.x} cy={mark.y} r="2.2" />
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
