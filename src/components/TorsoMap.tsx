import { useEffect, useMemo, useRef, useState } from "react";
import { AnatomyStack } from "../anatomy/AnatomyStack";
import { BackFigure } from "../anatomy/backPlaceholders";
import { muscleById, type FigureAspect, type MuscleId } from "../anatomy/catalog";
import { DepthRail } from "../anatomy/DepthRail";
import { ScaleneHints } from "../anatomy/placeholders";
import {
  clampDepth,
  loadStoredDepth,
  saveStoredDepth,
  type AnatomyDepth,
  type AnatomyLayerId,
} from "../anatomy/layers";
import { BlobField } from "../field/BlobField";
import { ReliefField } from "../field/ReliefField";
import { sitesFromSample } from "../field/sites";
import { ViewToggle } from "../field/ViewToggle";
import type { MapView } from "../field/view";
import { AspectToggle } from "../guide/AspectToggle";
import { loadStoredAspect, saveStoredAspect } from "../guide/aspect";
import {
  compileComposition,
  loadComposition,
  saveComposition,
} from "../guide/composer";
import { ComposerPanel } from "../guide/ComposerPanel";
import { GuideLegend } from "../guide/GuideLegend";
import { ScriptToggle } from "../guide/ScriptToggle";
import { SideInset } from "../guide/SideInset";
import {
  activationsAt,
  loadStoredScript,
  saveStoredScript,
  scriptById,
  type GuideScriptId,
} from "../guide/script";
import { useGuideClock } from "../guide/useGuideClock";
import { motionFill, motionGlow, motionStroke } from "../lib/color";
import { readSearchParam, writeSearchParams } from "../lib/urlState";
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

function initialScript(): GuideScriptId {
  const q = readSearchParam("script");
  if (q === "quiet" || q === "supported" || q === "lengthen" || q === "custom") return q;
  return loadStoredScript();
}

function initialAspect(): FigureAspect {
  const q = readSearchParam("aspect");
  if (q === "front" || q === "back") return q;
  return loadStoredAspect();
}

type Props = {
  sample: Sample | null;
  showLandmarks: boolean;
  view: MapView;
  onViewChange: (view: MapView) => void;
  depth?: AnatomyDepth;
};

export function TorsoMap({
  sample,
  showLandmarks,
  view,
  onViewChange,
  depth: depthProp,
}: Props) {
  const [hover, setHover] = useState<CompartmentId | null>(null);
  const [pinned, setPinned] = useState<CompartmentId | null>(null);
  const [inspectId, setInspectId] = useState<MuscleId | null>(null);
  const [storedDepth, setStoredDepth] = useState<AnatomyDepth>(loadStoredDepth);
  const [scriptId, setScriptId] = useState<GuideScriptId>(initialScript);
  const [composition, setComposition] = useState(loadComposition);
  const [aspect, setAspect] = useState<FigureAspect>(initialAspect);
  const [paused, setPaused] = useState(false);
  const [scrub, setScrub] = useState(0.2);
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const lastMeasured = useRef<Exclude<MapView, "guide">>(
    view === "field" ? "field" : "regions",
  );
  const viewRef = useRef(view);
  viewRef.current = view;
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const depth = depthProp ?? storedDepth;
  const ceiling = 12;
  const belly = sample ? meanAbdomen(sample) : 0;
  const total = sample ? meanRibCage(sample) + belly : 0;
  const compiled = useMemo(() => compileComposition(composition), [composition]);
  const script = scriptId === "custom" ? compiled : scriptById(scriptId);
  // Compose mode: picked muscles must tint visibly regardless of the depth
  // rail, so their layers get a floor opacity (front-aspect picks only —
  // the back figure has no layer peel).
  const revealLayers = useMemo(() => {
    if (scriptId !== "custom") return undefined;
    const set = new Set<AnatomyLayerId>();
    for (const id of [...composition.engage, ...composition.release, ...composition.stabilize]) {
      const def = muscleById(id);
      if (def.aspects.includes("front")) set.add(def.layer);
    }
    return set;
  }, [scriptId, composition]);
  const showGuide = view === "guide";
  const showBack = showGuide && aspect === "back";
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
  const ribLift = showGuide ? script.ribLift(phase) : 0;
  const pelvicLift = showGuide ? script.pelvicLift(phase) : 0;
  const scale = showGuide
    ? 1 + expand * 0.02
    : reduceMotion
      ? 1
      : 1 + Math.min(total, 22) * 0.0012;
  const sites = sitesFromSample(sample);
  const showField = view === "field";
  const readout = showGuide ? null : (hover ?? pinned);
  const inspected = inspectId ? muscleById(inspectId) : null;

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
    if (view !== "guide") lastMeasured.current = view;
  }, [view]);

  useEffect(() => {
    saveStoredScript(scriptId);
  }, [scriptId]);

  useEffect(() => {
    saveComposition(composition);
  }, [composition]);

  useEffect(() => {
    if (view === "guide") saveStoredAspect(aspect);
  }, [aspect, view]);

  useEffect(() => {
    writeSearchParams({ script: scriptId, aspect });
  }, [scriptId, aspect]);

  useEffect(() => {
    if (!showGuide) {
      setInspectId(null);
      return;
    }
    if (inspectId && !muscleById(inspectId).aspects.includes(aspect)) {
      setInspectId(null);
    }
  }, [showGuide, aspect, inspectId]);

  useEffect(() => {
    if (showGuide) setPinned(null);
  }, [showGuide]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        const v = viewRef.current;
        onViewChangeRef.current(v === "guide" ? lastMeasured.current : "guide");
        return;
      }
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        const v = viewRef.current;
        onViewChangeRef.current(
          v === "guide" ? "regions" : v === "field" ? "regions" : "field",
        );
        return;
      }
      if ((e.key === "b" || e.key === "B") && viewRef.current === "guide") {
        e.preventDefault();
        setAspect((a) => (a === "back" ? "front" : "back"));
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

  function inspectMuscle(id: MuscleId) {
    setInspectId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="torso-wrap">
      <div className="torso-stage">
      <svg
        viewBox="0 0 240 250"
        className="torso-svg"
        role="img"
        aria-label={showBack ? "Back torso anatomy" : "Front torso motion map"}
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
          {showBack ? (
            <BackFigure
              expand={expand}
              ribLift={ribLift}
              activations={activations}
              onInspect={showGuide ? inspectMuscle : undefined}
            />
          ) : (
            <AnatomyStack
              depth={depth}
              flatten={flatten}
              expand={expand}
              ribLift={ribLift}
              pelvicLift={pelvicLift}
              activations={activations}
              revealLayers={showGuide ? revealLayers : undefined}
              onInspect={showGuide ? inspectMuscle : undefined}
            />
          )}
          {showGuide && !showBack && (
            <ScaleneHints activations={activations} onInspect={inspectMuscle} />
          )}
          <g clipPath="url(#torso-clip)">
            {showGuide || showBack ? null : showField ? (
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
            {!showGuide &&
              (Object.keys(PATHS) as CompartmentId[]).map((id) => {
              const mm = sample?.compartments[id].displacementMm ?? 0;
              const active = readout === id;
              return (
                <path
                  key={id}
                  d={PATHS[id]}
                  fill="transparent"
                  stroke={active ? motionStroke(mm, ceiling) : "transparent"}
                  strokeWidth={active ? 1.6 : 0.75}
                  className="compartment"
                  onMouseEnter={() => setHover(id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setPinned((p) => (p === id ? null : id))}
                />
              );
            })}
            {!showBack && (
              <>
                <path className="bone-line" d={CLAVICLE_L} />
                <path className="bone-line" d={CLAVICLE_R} />
                <path className="bone-line" d={COSTAL_ARCH} />
                <line x1="120" y1="66" x2="120" y2="217" className="midline" />
              </>
            )}
          </g>
        </g>
        {showLandmarks &&
          !showGuide &&
          LANDMARKS.map((mark) => (
            <g key={mark.id} className="landmark">
              <circle cx={mark.x} cy={mark.y} r="2.1" />
              <title>{mark.label}</title>
            </g>
          ))}
      </svg>
      {!showBack && <DepthRail depth={depth} onChange={setDepth} />}
      </div>
      <ViewToggle view={view} onChange={onViewChange} />
      <div className="torso-caption">
        {readout && sample ? (
          <>
            <strong>{COMPARTMENT_LABELS[readout]}</strong>
            <span>{sample.compartments[readout].displacementMm.toFixed(1)} mm from rest</span>
          </>
        ) : inspected ? (
          <>
            <strong>{inspected.label}</strong>
            <span>{inspected.action}</span>
          </>
        ) : showGuide ? (
          <>
            <strong>Guide · {script.label}{showBack ? " · back" : ""}</strong>
            <span>A scripted reference loop. Tap a muscle to name it. G returns to your data. B flips the figure.</span>
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
          <div className="guide-toggles">
            <ScriptToggle scriptId={scriptId} onChange={setScriptId} />
            <AspectToggle aspect={aspect} onChange={setAspect} />
          </div>
          <p className="guide-blurb">{script.blurb}</p>
          {scriptId === "custom" && (
            <ComposerPanel
              composition={composition}
              onChange={setComposition}
              onAspectHint={setAspect}
              aspect={aspect}
            />
          )}
          {script.sideCaption && !showBack && <SideInset script={script} phase={phase} />}
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
