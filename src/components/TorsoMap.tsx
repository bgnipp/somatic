import { useEffect, useRef, useState } from "react";
import { AnatomyStack } from "../anatomy/AnatomyStack";
import { DepthRail } from "../anatomy/DepthRail";
import { ScaleneHints } from "../anatomy/placeholders";
import {
  clampDepth,
  loadStoredDepth,
  saveStoredDepth,
  type AnatomyDepth,
} from "../anatomy/layers";
import { BlobField } from "../field/BlobField";
import { ReliefField } from "../field/ReliefField";
import { sitesFromSample } from "../field/sites";
import { ViewToggle } from "../field/ViewToggle";
import { loadStoredView, saveStoredView, type MapView } from "../field/view";
import { GuideLegend } from "../guide/GuideLegend";
import { ScriptToggle } from "../guide/ScriptToggle";
import {
  activationsAt,
  loadStoredScript,
  saveStoredScript,
  scriptById,
  type GuideScriptId,
} from "../guide/script";
import { useGuideClock } from "../guide/useGuideClock";
import { motionFill, motionGlow, motionStroke } from "../lib/color";
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
  const [view, setView] = useState<MapView>(loadStoredView);
  const [scriptId, setScriptId] = useState<GuideScriptId>(loadStoredScript);
  const [paused, setPaused] = useState(false);
  const [scrub, setScrub] = useState(0.2);
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const lastMeasured = useRef<Exclude<MapView, "guide">>(
    loadStoredView() === "field" ? "field" : "regions",
  );
  const depth = depthProp ?? storedDepth;
  const ceiling = 12;
  const belly = sample ? meanAbdomen(sample) : 0;
  const total = sample ? meanRibCage(sample) + belly : 0;
  const script = scriptById(scriptId);
  const showGuide = view === "guide";
  const held = reduceMotion || paused;
  const phase = useGuideClock(script.cycleMs, {
    reduceMotion,
    paused,
    scrub: held ? scrub : undefined,
  });
  const activations = showGuide ? activationsAt(script, phase) : undefined;
  const flatten = showGuide
    ? script.diaphragmFlatten(phase)
    : reduceMotion || depth > 2
      ? 0
      : Math.min(1, belly / 9.5);
  const expand = showGuide ? script.ribExpand(phase) : 0;
  const pelvicLift = showGuide ? script.pelvicLift(phase) : 0;
  const scale = showGuide
    ? 1 + expand * 0.02
    : reduceMotion
      ? 1
      : 1 + Math.min(total, 22) * 0.0012;
  const sites = sitesFromSample(sample);
  const showField = view === "field";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (depthProp !== undefined) return;
    saveStoredDepth(storedDepth);
  }, [storedDepth, depthProp]);

  useEffect(() => {
    saveStoredView(view);
    if (view !== "guide") lastMeasured.current = view;
  }, [view]);

  useEffect(() => {
    saveStoredScript(scriptId);
  }, [scriptId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setView((v) => (v === "guide" ? lastMeasured.current : "guide"));
        return;
      }
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        setView((v) => {
          if (v === "guide") return "regions";
          return v === "field" ? "regions" : "field";
        });
        return;
      }
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
          <filter id="motion-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
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
          <AnatomyStack
            depth={depth}
            flatten={flatten}
            expand={expand}
            pelvicLift={pelvicLift}
            activations={activations}
          />
          {showGuide && (
            <ScaleneHints activation={activations?.scalenes ?? 0} />
          )}
          <g clipPath="url(#torso-clip)">
            {showGuide ? null : showField ? (
              reduceMotion ? (
                <BlobField sites={sites} />
              ) : (
                <ReliefField sites={sites} depth={depth} />
              )
            ) : (
              <>
                {(Object.keys(PATHS) as CompartmentId[]).map((id) => {
                  const mm = sample?.compartments[id].displacementMm ?? 0;
                  return (
                    <path
                      key={`${id}-glow`}
                      d={PATHS[id]}
                      fill={motionGlow(mm, ceiling)}
                      filter="url(#motion-glow)"
                      className="compartment-glow"
                      pointerEvents="none"
                    />
                  );
                })}
                {(Object.keys(PATHS) as CompartmentId[]).map((id) => {
                  const mm = sample?.compartments[id].displacementMm ?? 0;
                  return (
                    <path
                      key={`${id}-wash`}
                      d={PATHS[id]}
                      fill={motionFill(mm, ceiling)}
                      className="compartment-glow"
                      pointerEvents="none"
                    />
                  );
                })}
              </>
            )}
            {(Object.keys(PATHS) as CompartmentId[]).map((id) => {
              const mm = sample?.compartments[id].displacementMm ?? 0;
              return (
                <path
                  key={id}
                  d={PATHS[id]}
                  fill="transparent"
                  stroke={hover === id ? motionStroke(mm, ceiling) : "transparent"}
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
      <ViewToggle view={view} onChange={setView} />
      <div className="torso-caption">
        {hover && sample ? (
          <>
            <strong>{COMPARTMENT_LABELS[hover]}</strong>
            <span>{sample.compartments[hover].displacementMm.toFixed(1)} mm from rest</span>
          </>
        ) : showGuide ? (
          <>
            <strong>Guide · {script.label}</strong>
            <span>A reference loop of the coordinated breath. G returns to your data.</span>
          </>
        ) : showField ? (
          <>
            <strong>Motion field</strong>
            <span>Interpolated from 6 regions · higher is more motion · ~10× actual.</span>
          </>
        ) : (
          <>
            <strong>Front view</strong>
            <span>Brighter is more motion. [ and ] peel layers. V toggles field. G opens the guide.</span>
          </>
        )}
      </div>
      {showGuide && (
        <>
          <ScriptToggle scriptId={scriptId} onChange={setScriptId} />
          <p className="guide-blurb">{script.blurb}</p>
          <div className="guide-controls">
            <button
              type="button"
              aria-pressed={held}
              disabled={reduceMotion}
              onClick={() => {
                if (!paused) setScrub(phase);
                setPaused((p) => !p);
              }}
            >
              {held ? "Play" : "Pause"}
            </button>
            {held && (
              <label className="guide-phase">
                Breath phase
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={scrub}
                  onChange={(e) => {
                    setScrub(Number(e.target.value));
                    if (!paused && !reduceMotion) setPaused(true);
                  }}
                />
              </label>
            )}
          </div>
          <GuideLegend />
        </>
      )}
    </div>
  );
}
