import { activationColor } from "../lib/color";
import { TORSO } from "../components/torsoPaths";
import type { MuscleId } from "./catalog";
import type { AnatomyLayerId } from "./layers";

/**
 * Schematic medical-diagram placeholders, registered to the current
 * torso viewBox. Dim line art — the motion heatmap stays the bright signal.
 *
 * `flatten` (0–1) lowers the diaphragm dome on inhale.
 * `expand` (0–1) widens/raises the rib arcs.
 * `ribLift` (0–1) raises the ribs away from the pelvis (cage lengthening).
 * `pelvicLift` (−1..1) raises (engaged) or lowers (yielded) the pelvic floor.
 * `activations` tints structures in Guide view only; omitted elsewhere.
 */

export const STRUCTURE_CLASSES: Partial<Record<MuscleId, string>> = {
  pelvic_floor: "anatomy-pelvic-floor",
  diaphragm: "anatomy-diaphragm",
  transversus: "anatomy-transversus",
  rectus: "anatomy-rectus",
  obliques: "anatomy-oblique",
  intercostals: "anatomy-intercostal",
  scalenes: "anatomy-scalene",
  traps: "anatomy-trap",
  platysma: "anatomy-platysma",
  pec_major: "anatomy-pec",
  pec_minor: "anatomy-pec-minor",
};

type Activations = Partial<Record<MuscleId, number>>;

type LayerProps = {
  flatten?: number;
  expand?: number;
  ribLift?: number;
  pelvicLift?: number;
  activations?: Activations;
};

function act(activations: Activations | undefined, id: MuscleId): number {
  return activations?.[id] ?? 0;
}

function TintFill({ d, a }: { d: string; a: number }) {
  if (Math.abs(a) < 0.02) return null;
  return <path d={d} fill={activationColor(a)} stroke="none" className="anatomy-tint" pointerEvents="none" />;
}

function TintStroke({ d, a, width = 2.1 }: { d: string; a: number; width?: number }) {
  if (Math.abs(a) < 0.02) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={activationColor(a)}
      strokeWidth={width}
      strokeLinecap="round"
      className="anatomy-tint"
      pointerEvents="none"
    />
  );
}

function ribPair(attachY: number, halfWidth: number, lateralY: number): [string, string] {
  const rise = lateralY - attachY;
  const left = `M117.6 ${attachY} C${(120 - halfWidth * 0.42).toFixed(1)} ${(attachY + rise * 0.22).toFixed(1)} ${(120 - halfWidth * 0.82).toFixed(1)} ${(attachY + rise * 0.58).toFixed(1)} ${(120 - halfWidth).toFixed(1)} ${lateralY}`;
  const right = `M122.4 ${attachY} C${(120 + halfWidth * 0.42).toFixed(1)} ${(attachY + rise * 0.22).toFixed(1)} ${(120 + halfWidth * 0.82).toFixed(1)} ${(attachY + rise * 0.58).toFixed(1)} ${(120 + halfWidth).toFixed(1)} ${lateralY}`;
  return [left, right];
}

const RIBS: [number, number, number][] = [
  [72, 28, 78],
  [84, 34, 92],
  [96, 36, 108],
  [110, 36, 126],
  [124, 34, 144],
  [136, 30, 158],
  [146, 26, 172],
];

export function diaphragmPath(flatten = 0): string {
  const t = Math.min(1, Math.max(0, flatten));
  const apex = 140 + t * 12;
  const mid = 156 + t * 8;
  const inner = 168 + t * 4;
  return `M90 178 C96 ${mid} 108 ${apex + 6} 120 ${apex} C132 ${apex + 6} 144 ${mid} 150 178 C140 ${inner + 6} 128 ${inner} 120 ${inner} C112 ${inner} 100 ${inner + 6} 90 178 Z`;
}

export function diaphragmRim(flatten = 0): string {
  const t = Math.min(1, Math.max(0, flatten));
  const apex = 140 + t * 12;
  const mid = 156 + t * 8;
  return `M90 178 C96 ${mid} 108 ${apex + 6} 120 ${apex} C132 ${apex + 6} 144 ${mid} 150 178`;
}

/** Shallow bowl in the pelvic rim. Positive lift raises it; negative drops it. */
export function pelvicFloorPath(lift = 0): string {
  const t = Math.min(1, Math.max(-1, lift));
  const apex = 216 - t * 3;
  const attach = 210 - t * 1.2;
  const bowl = attach + 5 + Math.max(0, -t) * 1.5;
  return `M102 ${attach} C108 ${apex} 114 ${apex + 1} 120 ${apex} C126 ${apex + 1} 132 ${apex} 138 ${attach} C132 ${bowl} 126 ${bowl + 0.6} 120 ${bowl} C114 ${bowl + 0.6} 108 ${bowl} 102 ${attach} Z`;
}

const TRANSVERSUS = [
  "M96 184 C108 180 132 180 144 184",
  "M98 194 C110 190 130 190 142 194",
  "M100 204 C112 200 128 200 140 204",
];

const RECTUS: string[] = [150, 166, 182].flatMap((y0) => {
  const y1 = y0 === 150 ? 163 : y0 === 166 ? 179 : 198;
  return [
    `M107 ${y0 + 1} C110 ${y0} 115 ${y0} 118 ${y0 + 1} L118 ${y1 - 1} C115 ${y1} 110 ${y1} 107 ${y1 - 1} Z`,
    `M122 ${y0 + 1} C125 ${y0} 130 ${y0} 133 ${y0 + 1} L133 ${y1 - 1} C130 ${y1} 125 ${y1} 122 ${y1 - 1} Z`,
  ];
});

const OBLIQUES = [
  "M92 128 C88 148 90 170 97 192 C101 182 104 168 105 154 C100 146 95 137 92 128 Z",
  "M148 128 C152 148 150 170 143 192 C139 182 136 168 135 154 C140 146 145 137 148 128 Z",
];

const TRAPS = [
  "M108 62 L90 74 L111 70 Z",
  "M132 62 L150 74 L129 70 Z",
];

const PEC_MAJOR = [
  "M122 72 C132 74 144 80 150 90 C148 104 140 114 128 118 C124 108 122 92 122 72 Z",
  "M118 72 C108 74 96 80 90 90 C92 104 100 114 112 118 C116 108 118 92 118 72 Z",
  "M88 74 C84 80 82 90 83 100 C86 94 89 86 92 80 Z",
  "M152 74 C156 80 158 90 157 100 C154 94 151 86 148 80 Z",
];

/** Small wedges from ribs 3–5 toward the coracoid, under the major. */
const PEC_MINOR = [
  "M108 108 L98 118 L92 74 Z",
  "M132 108 L142 118 L148 74 Z",
];

const SCALENES = [
  "M114 44 L110 58",
  "M117 43 L114 58",
  "M120 42 L118 58",
  "M120 42 L122 58",
  "M123 43 L126 58",
  "M126 44 L130 58",
];

/** Sternocleidomastoid: mastoid down to the sternal notch, each side. */
const SCM = ["M111 40 C111 47 114 54 118 60", "M129 40 C129 47 126 54 122 60"];

/** Platysma: superficial sheet fanning from the jaw over the clavicles. */
const PLATYSMA = [
  "M113 45 C111 51 106 58 99 63",
  "M117 46 C116 52 112 59 106 65",
  "M123 46 C124 52 128 59 134 65",
  "M127 45 C129 51 134 58 141 63",
];

function SkeletonLayer({ expand = 0, ribLift = 0 }: LayerProps) {
  const widthScale = 1 + expand * 0.05;
  const lift = expand * 2 + ribLift * 2.5;
  return (
    <g className="anatomy-placeholder anatomy-skeleton">
      <path
        className="anatomy-bone anatomy-sternum"
        transform={ribLift ? `translate(0 ${(-ribLift * 1.5).toFixed(2)})` : undefined}
        d="M115 66 C113 68 113 72 115 76 L117 80 L117 144 C117 148 118 151 120 152 C122 151 123 148 123 144 L123 80 L125 76 C127 72 127 68 125 66 C123 64 117 64 115 66 Z"
      />
      {RIBS.map(([attachY, halfWidth, lateralY], i) => {
        const [left, right] = ribPair(attachY, halfWidth * widthScale, lateralY - lift);
        return (
          <g key={i} className={i >= 5 ? "anatomy-cartilage" : "anatomy-bone"}>
            <path d={left} />
            <path d={right} />
          </g>
        );
      })}
      <path className="anatomy-bone" d="M120 66 C110 66 100 68 90 74" />
      <path className="anatomy-bone" d="M120 66 C130 66 140 68 150 74" />
      <g className="anatomy-spine">
        {[156, 166, 176, 186, 196].map((y) => (
          <rect key={y} x="117.2" y={y} width="5.6" height="7" rx="1.2" />
        ))}
      </g>
      <path
        className="anatomy-bone anatomy-pelvis"
        d="M104 200 C96 204 94 212 98 218 C104 222 112 220 120 218 C128 220 136 222 142 218 C146 212 144 204 136 200 C130 198 124 202 120 204 C116 202 110 198 104 200 Z"
      />
    </g>
  );
}

function DeepLayer({ flatten = 0, pelvicLift = 0, activations }: LayerProps) {
  const dome = diaphragmPath(flatten);
  const floor = pelvicFloorPath(pelvicLift);
  const diaA = act(activations, "diaphragm");
  const tvA = act(activations, "transversus");
  const pfA = act(activations, "pelvic_floor");
  return (
    <g className="anatomy-placeholder anatomy-deep">
      <path className="anatomy-diaphragm" d={dome} />
      <path className="anatomy-diaphragm-rim" d={diaphragmRim(flatten)} />
      <TintFill d={dome} a={diaA} />
      <path className="anatomy-psoas" d="M116 158 C114 176 108 196 102 214" />
      <path className="anatomy-psoas" d="M124 158 C126 176 132 196 138 214" />
      {TRANSVERSUS.map((d) => (
        <path key={d} className="anatomy-transversus" d={d} />
      ))}
      {TRANSVERSUS.map((d) => (
        <TintStroke key={`${d}-tint`} d={d} a={tvA} width={1.8} />
      ))}
      <path className="anatomy-pelvic-floor" d={floor} />
      <TintFill d={floor} a={pfA} />
    </g>
  );
}

function IntercostalLayer({ expand = 0, ribLift = 0, activations }: LayerProps) {
  const widthScale = 1 + expand * 0.05;
  const lift = expand * 2 + ribLift * 2.5;
  const hatches: string[] = [];
  for (let i = 0; i < RIBS.length - 1; i++) {
    const [y0, w0, ly0] = RIBS[i];
    const [y1, w1, ly1] = RIBS[i + 1];
    const midAttach = (y0 + y1) / 2;
    const midW = ((w0 + w1) / 2) * widthScale;
    const midLat = (ly0 + ly1) / 2 - lift;
    for (const side of [-1, 1]) {
      const x0 = 120 + side * 6;
      const x1 = 120 + side * (midW - 3);
      const yA = midAttach + 1;
      const yB = midLat - 1;
      hatches.push(
        `M${x0.toFixed(1)} ${yA.toFixed(1)} L${(x0 + side * 5).toFixed(1)} ${(yA + 3).toFixed(1)}`,
        `M${((x0 + x1) / 2).toFixed(1)} ${((yA + yB) / 2).toFixed(1)} L${((x0 + x1) / 2 + side * 5).toFixed(1)} ${((yA + yB) / 2 + 3).toFixed(1)}`,
        `M${x1.toFixed(1)} ${yB.toFixed(1)} L${(x1 + side * 4).toFixed(1)} ${(yB + 2.5).toFixed(1)}`,
      );
    }
  }
  const a = act(activations, "intercostals");
  return (
    <g className="anatomy-placeholder anatomy-intercostal">
      {hatches.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {hatches.map((d, i) => (
        <TintStroke key={`tint-${i}`} d={d} a={a} width={1.4} />
      ))}
    </g>
  );
}

function AbWallLayer({ activations }: LayerProps) {
  const rectA = act(activations, "rectus");
  const oblA = act(activations, "obliques");
  return (
    <g className="anatomy-placeholder anatomy-ab-wall">
      {RECTUS.map((d) => (
        <path key={d} className="anatomy-rectus" d={d} />
      ))}
      {RECTUS.map((d) => (
        <TintFill key={`${d}-tint`} d={d} a={rectA} />
      ))}
      <path className="anatomy-linea" d="M120 148 L120 206" />
      {OBLIQUES.map((d) => (
        <path key={d} className="anatomy-oblique" d={d} />
      ))}
      {OBLIQUES.map((d) => (
        <TintFill key={`${d}-tint`} d={d} a={oblA} />
      ))}
      {["M96 140 L106 148", "M94 156 L104 164", "M96 172 L105 180"].map((d) => (
        <path key={d} className="anatomy-oblique-fiber" d={d} />
      ))}
      {["M144 140 L134 148", "M146 156 L136 164", "M144 172 L135 180"].map((d) => (
        <path key={d} className="anatomy-oblique-fiber" d={d} />
      ))}
    </g>
  );
}

function SuperficialLayer({ activations }: LayerProps) {
  const trapA = act(activations, "traps");
  const majorA = act(activations, "pec_major");
  const minorA = act(activations, "pec_minor");
  return (
    <g className="anatomy-placeholder anatomy-superficial">
      {PEC_MINOR.map((d) => (
        <path key={d} className="anatomy-pec-minor" d={d} />
      ))}
      {PEC_MINOR.map((d) => (
        <TintFill key={`${d}-tint`} d={d} a={minorA} />
      ))}
      {PEC_MAJOR.map((d) => (
        <path key={d} className="anatomy-pec" d={d} />
      ))}
      {PEC_MAJOR.map((d) => (
        <TintFill key={`${d}-tint`} d={d} a={majorA} />
      ))}
      {TRAPS.map((d) => (
        <path key={d} className="anatomy-trap" d={d} />
      ))}
      {TRAPS.map((d) => (
        <TintFill key={`${d}-tint`} d={d} a={trapA} />
      ))}
    </g>
  );
}

function SurfaceLayer() {
  return (
    <g className="anatomy-placeholder anatomy-surface">
      <path d={TORSO} />
    </g>
  );
}

/** Neck muscles sit outside #torso-clip — mount unclipped, Guide view only. */
export function ScaleneHints({ activations }: { activations?: Activations }) {
  const scaleneA = act(activations, "scalenes");
  const platysmaA = act(activations, "platysma");
  return (
    <g className="anatomy-placeholder anatomy-scalenes" pointerEvents="none" aria-hidden="true">
      {SCALENES.map((d) => (
        <path key={d} className="anatomy-scalene" d={d} />
      ))}
      {SCM.map((d) => (
        <path key={d} className="anatomy-scm" d={d} />
      ))}
      {PLATYSMA.map((d) => (
        <path key={d} className="anatomy-platysma" d={d} />
      ))}
      {SCALENES.map((d) => (
        <TintStroke key={`${d}-tint`} d={d} a={scaleneA} width={1.8} />
      ))}
      {SCM.map((d) => (
        <TintStroke key={`${d}-tint`} d={d} a={scaleneA} width={2} />
      ))}
      {PLATYSMA.map((d) => (
        <TintStroke key={`${d}-tint`} d={d} a={platysmaA} width={1.6} />
      ))}
    </g>
  );
}

export function AnatomyPlaceholder({
  id,
  flatten = 0,
  expand = 0,
  ribLift = 0,
  pelvicLift = 0,
  activations,
}: {
  id: AnatomyLayerId;
  flatten?: number;
  expand?: number;
  ribLift?: number;
  pelvicLift?: number;
  activations?: Activations;
}) {
  const props: LayerProps = { flatten, expand, ribLift, pelvicLift, activations };
  switch (id) {
    case "skeleton":
      return <SkeletonLayer {...props} />;
    case "deep":
      return <DeepLayer {...props} />;
    case "intercostal":
      return <IntercostalLayer {...props} />;
    case "ab_wall":
      return <AbWallLayer {...props} />;
    case "superficial":
      return <SuperficialLayer {...props} />;
    case "surface":
      return <SurfaceLayer />;
  }
}
