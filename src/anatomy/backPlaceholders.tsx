import type { MuscleId } from "./catalog";
import { MuscleHit, TintFill, TintStroke } from "./placeholders";
import {
  BACK_RIBS,
  SCAPULA_L,
  SCAPULA_R,
  SPINE,
  VERTEBRA_YS,
  backRibPair,
} from "../components/torsoBackPaths";

type Activations = Partial<Record<MuscleId, number>>;

export const BACK_STRUCTURE_CLASSES: Partial<Record<MuscleId, string>> = {
  erector_iliocostalis: "anatomy-erector-il",
  erector_longissimus: "anatomy-erector-lo",
  levatores_costarum: "anatomy-levator",
  intertransversarii: "anatomy-intertrans",
  rhomboids: "anatomy-rhomboid",
  traps: "anatomy-trap-back",
};

function act(activations: Activations | undefined, id: MuscleId): number {
  return activations?.[id] ?? 0;
}

const ERECTOR_IL = [
  "M106 72 C104 110 103 150 104 198 C107 200 110 198 111 194 C110 150 110 110 111 74 Z",
  "M134 72 C136 110 137 150 136 198 C133 200 130 198 129 194 C130 150 130 110 129 74 Z",
];

const ERECTOR_LO = [
  "M112 70 C111 108 111 148 112 196 C114 198 117 196 117 192 C116 148 116 108 116 72 Z",
  "M128 70 C129 108 129 148 128 196 C126 198 123 196 123 192 C124 148 124 108 124 72 Z",
];

const ERECTOR_FIBERS = [
  "M108 86 L110 92",
  "M107 118 L110 124",
  "M107 150 L110 156",
  "M108 182 L110 188",
  "M114 84 L116 90",
  "M113 116 L116 122",
  "M113 148 L116 154",
  "M114 180 L116 186",
  "M132 86 L130 92",
  "M133 118 L130 124",
  "M133 150 L130 156",
  "M132 182 L130 188",
  "M126 84 L124 90",
  "M127 116 L124 122",
  "M127 148 L124 154",
  "M126 180 L124 186",
];

function levatorPaths(): string[] {
  const out: string[] = [];
  const ys = [78, 90, 102, 116, 130, 144];
  for (const y of ys) {
    out.push(`M118 ${y} L${(118 - 16).toFixed(0)} ${y + 8}`);
    out.push(`M122 ${y} L${(122 + 16).toFixed(0)} ${y + 8}`);
  }
  return out;
}

const LEVATORS = levatorPaths();

function intertransPaths(): string[] {
  const out: string[] = [];
  for (const y of [70, 80, 90, 100, 110]) {
    out.push(`M116 ${y} L116 ${y + 5}`);
    out.push(`M124 ${y} L124 ${y + 5}`);
  }
  return out;
}

const INTERTRANS = intertransPaths();

const RHOMBOIDS = [
  "M118 80 L108 86 L102 108 L118 108 Z",
  "M122 80 L132 86 L138 108 L122 108 Z",
];

const TRAPS_BACK = "M120 58 L88 78 L120 118 L152 78 Z";

type Props = {
  expand?: number;
  ribLift?: number;
  activations?: Activations;
  onInspect?: (id: MuscleId) => void;
};

export function BackFigure({ expand = 0, ribLift = 0, activations, onInspect }: Props) {
  const widthScale = 1 + expand * 0.05;
  const lift = expand * 2 + ribLift * 2.5;
  const ilA = act(activations, "erector_iliocostalis");
  const loA = act(activations, "erector_longissimus");
  const levA = act(activations, "levatores_costarum");
  const itA = act(activations, "intertransversarii");
  const rhoA = act(activations, "rhomboids");
  const trapA = act(activations, "traps");

  return (
    <g className="anatomy-placeholder anatomy-back" aria-hidden={!onInspect}>
      <path className="anatomy-bone anatomy-spine-line" d={SPINE} />
      {VERTEBRA_YS.map((y) => (
        <line key={y} className="anatomy-vertebra" x1="116" y1={y} x2="124" y2={y} />
      ))}
      {BACK_RIBS.map(([attachY, halfWidth, lateralY], i) => {
        const [left, right] = backRibPair(attachY, halfWidth * widthScale, lateralY - lift);
        return (
          <g key={i} className="anatomy-bone">
            <path d={left} />
            <path d={right} />
          </g>
        );
      })}
      <path className="anatomy-scapula" d={SCAPULA_L} />
      <path className="anatomy-scapula" d={SCAPULA_R} />

      <MuscleHit id="erector_iliocostalis" onInspect={onInspect}>
        {ERECTOR_IL.map((d) => (
          <path key={d} className="anatomy-erector-il" d={d} />
        ))}
        {ERECTOR_IL.map((d) => (
          <TintFill key={`${d}-tint`} d={d} a={ilA} />
        ))}
        {ERECTOR_FIBERS.map((d) => (
          <path key={d} className="anatomy-erector-fiber" d={d} />
        ))}
      </MuscleHit>
      <MuscleHit id="erector_longissimus" onInspect={onInspect}>
        {ERECTOR_LO.map((d) => (
          <path key={d} className="anatomy-erector-lo" d={d} />
        ))}
        {ERECTOR_LO.map((d) => (
          <TintFill key={`${d}-tint`} d={d} a={loA} />
        ))}
      </MuscleHit>

      <MuscleHit id="levatores_costarum" onInspect={onInspect}>
        {LEVATORS.map((d) => (
          <path key={d} className="anatomy-levator" d={d} />
        ))}
        {LEVATORS.map((d) => (
          <TintStroke key={`${d}-tint`} d={d} a={levA} width={1.6} />
        ))}
      </MuscleHit>

      <MuscleHit id="intertransversarii" onInspect={onInspect}>
        {INTERTRANS.map((d) => (
          <path key={d} className="anatomy-intertrans" d={d} />
        ))}
        {INTERTRANS.map((d) => (
          <TintStroke key={`${d}-tint`} d={d} a={itA} width={1.4} />
        ))}
      </MuscleHit>

      <MuscleHit id="rhomboids" onInspect={onInspect}>
        {RHOMBOIDS.map((d) => (
          <path key={d} className="anatomy-rhomboid" d={d} />
        ))}
        {RHOMBOIDS.map((d) => (
          <TintFill key={`${d}-tint`} d={d} a={rhoA} />
        ))}
      </MuscleHit>

      <MuscleHit id="traps" onInspect={onInspect}>
        <path className="anatomy-trap-back" d={TRAPS_BACK} />
        <TintFill d={TRAPS_BACK} a={trapA} />
      </MuscleHit>
    </g>
  );
}
