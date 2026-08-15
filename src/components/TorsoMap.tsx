import { useEffect, useState } from "react";
import { AnatomyStack } from "../anatomy/AnatomyStack";
import { DepthRail } from "../anatomy/DepthRail";
import {
  clampDepth,
  loadStoredDepth,
  saveStoredDepth,
  type AnatomyDepth,
} from "../anatomy/layers";
import { motionFill, motionStroke } from "../lib/color";
import { meanAbdomen, meanRibCage } from "../mock/synthesize";
import type { CompartmentId, Sample } from "../types";
import { COMPARTMENT_LABELS, LANDMARKS } from "../types";
import {
  CLAVICLE_L,
  CLAVICLE_R,
  COSTAL_ARCH,
  LEFT_ARM,
  NECK,
  PATHS,
  RIGHT_ARM,
  TORSO,
} from "./torsoPaths";

type Props = {
  sample: Sample | null;
  showLandmarks: boolean;
  depth?: AnatomyDepth;
};

export function TorsoMap({
  sample,
  showLandmarks,
  depth: depthProp,
}: Props) {
  const [hover, setHover] = useState<CompartmentId | null>(null);
  const [storedDepth, setStoredDepth] = useState<AnatomyDepth>(loadStoredDepth);
  const depth = depthProp ?? storedDepth;
  const ceiling = 12;
  const total = sample ? meanRibCage(sample) + meanAbdomen(sample) : 0;
  const scale = 1 + Math.min(total, 22) * 0.0012;

  useEffect(() => {
    if (depthProp !== undefined) return;
    saveStoredDepth(storedDepth);
  }, [storedDepth, depthProp]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key !== "[" && e.key !== "]") return;
      if (depthProp !== undefined) return;
      e.preventDefault();
      setStoredDepth((d) => clampDepth(d + (e.key === "]" ? 1 : -1)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [depthProp]);

  function setDepth(next: AnatomyDepth) {
    if (depthProp !== undefined) return;
    setStoredDepth(next);
  }

  return (
    <div className="torso-wrap">
      <div className="torso-stage">
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
        <path className="torso-neck" d={NECK} />
        <g
          className="torso-breathe"
          style={{ transform: `scale(${scale})`, transformOrigin: "120px 96px" }}
        >
          <path className="torso-limb" d={LEFT_ARM} />
          <path className="torso-limb" d={RIGHT_ARM} />
          <path className="torso-context" d={TORSO} />
          <AnatomyStack depth={depth} />
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
      <DepthRail depth={depth} onChange={setDepth} />
      </div>
      <div className="torso-caption">
        {hover && sample ? (
          <>
            <strong>{COMPARTMENT_LABELS[hover]}</strong>
            <span>{sample.compartments[hover].displacementMm.toFixed(1)} mm from rest</span>
          </>
        ) : (
          <>
            <strong>Front view</strong>
            <span>Brighter is more motion. [ and ] peel layers.</span>
          </>
        )}
      </div>
    </div>
  );
}
