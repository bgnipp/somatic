import { TORSO } from "../components/torsoPaths";

/**
 * Schematic medical-diagram placeholders, registered to the current
 * torso viewBox. Dim line art — the motion heatmap stays the bright signal.
 *
 * `flatten` (0–1) lowers the diaphragm dome on inhale. Unused until G4
 * wires live abdominal displacement; G1 renders rest (0).
 */

type LayerProps = {
  flatten?: number;
};

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

function SkeletonLayer() {
  return (
    <g className="anatomy-placeholder anatomy-skeleton">
      <path
        className="anatomy-bone anatomy-sternum"
        d="M115 66 C113 68 113 72 115 76 L117 80 L117 144 C117 148 118 151 120 152 C122 151 123 148 123 144 L123 80 L125 76 C127 72 127 68 125 66 C123 64 117 64 115 66 Z"
      />
      {RIBS.map(([attachY, halfWidth, lateralY], i) => {
        const [left, right] = ribPair(attachY, halfWidth, lateralY);
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

function DeepLayer({ flatten = 0 }: LayerProps) {
  return (
    <g className="anatomy-placeholder anatomy-deep">
      <path className="anatomy-diaphragm" d={diaphragmPath(flatten)} />
      <path className="anatomy-diaphragm-rim" d={diaphragmRim(flatten)} />
      <path className="anatomy-psoas" d="M116 158 C114 176 108 196 102 214" />
      <path className="anatomy-psoas" d="M124 158 C126 176 132 196 138 214" />
      <path className="anatomy-transversus" d="M96 184 C108 180 132 180 144 184" />
      <path className="anatomy-transversus" d="M98 194 C110 190 130 190 142 194" />
      <path className="anatomy-transversus" d="M100 204 C112 200 128 200 140 204" />
    </g>
  );
}

function IntercostalLayer() {
  const hatches: string[] = [];
  for (let i = 0; i < RIBS.length - 1; i++) {
    const [y0, w0, ly0] = RIBS[i];
    const [y1, w1, ly1] = RIBS[i + 1];
    const midAttach = (y0 + y1) / 2;
    const midW = (w0 + w1) / 2;
    const midLat = (ly0 + ly1) / 2;
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
  return (
    <g className="anatomy-placeholder anatomy-intercostal">
      {hatches.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

function SuperficialLayer() {
  return (
    <g className="anatomy-placeholder anatomy-superficial">
      <path
        className="anatomy-pec"
        d="M122 72 C132 74 144 80 150 90 C148 104 140 114 128 118 C124 108 122 92 122 72 Z"
      />
      <path
        className="anatomy-pec"
        d="M118 72 C108 74 96 80 90 90 C92 104 100 114 112 118 C116 108 118 92 118 72 Z"
      />
      <path className="anatomy-rectus" d="M112 152 L120 150 L128 152 L128 164 L112 164 Z" />
      <path className="anatomy-rectus" d="M112 166 L128 166 L128 178 L112 178 Z" />
      <path className="anatomy-rectus" d="M113 180 L127 180 L126 194 L114 194 Z" />
      <path className="anatomy-linea" d="M120 150 L120 208" />
      <path
        className="anatomy-oblique"
        d="M90 118 C88 140 92 164 98 186 C104 176 108 164 110 152 C102 140 94 128 90 118 Z"
      />
      <path
        className="anatomy-oblique"
        d="M150 118 C152 140 148 164 142 186 C136 176 132 164 130 152 C138 140 146 128 150 118 Z"
      />
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

export function AnatomyPlaceholder({
  id,
  flatten = 0,
}: {
  id: "skeleton" | "deep" | "intercostal" | "superficial" | "surface";
  flatten?: number;
}) {
  switch (id) {
    case "skeleton":
      return <SkeletonLayer />;
    case "deep":
      return <DeepLayer flatten={flatten} />;
    case "intercostal":
      return <IntercostalLayer />;
    case "superficial":
      return <SuperficialLayer />;
    case "surface":
      return <SurfaceLayer />;
  }
}
