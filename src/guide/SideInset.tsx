import type { GuideScript } from "./script";

/**
 * Schematic sagittal inset for the Guide view. The front view cannot show
 * the slight C-curve of the spine on the active exhale (her follow-up note),
 * so this small side profile renders it: spine flexes forward as the ribs
 * are pulled down, and the belly wall swells with the descending diaphragm.
 * Body faces left.
 */

function spinePath(flex: number): string {
  const f = flex * 5;
  return `M48 30 C${(46 - f * 0.7).toFixed(1)} 46 ${(43 - f).toFixed(1)} 64 ${(43 - f * 0.7).toFixed(1)} 82 C${(43 - f * 0.25).toFixed(1)} 100 45 110 45 120`;
}

function frontPath(flatten: number, flex: number): string {
  const belly = 3 + flatten * 4.5;
  const chestX = 33 - flex * 2;
  return `M44 28 C${chestX.toFixed(1)} 36 ${(chestX - 3).toFixed(1)} 50 30 62 C${(27 - belly * 0.5).toFixed(1)} 74 ${(26 - belly).toFixed(1)} 86 ${(29 - belly * 0.6).toFixed(1)} 98 C31 108 37 116 43 120`;
}

function diaphragmSide(flatten: number): string {
  const drop = flatten * 6;
  return `M31 ${(66 + drop).toFixed(1)} C36 ${(61 + drop).toFixed(1)} 41 ${(62 + drop).toFixed(1)} 44 ${(67 + drop).toFixed(1)}`;
}

export function SideInset({ script, phase }: { script: GuideScript; phase: number }) {
  const flex = script.spineFlex(phase);
  const flatten = script.diaphragmFlatten(phase);
  return (
    <figure className="side-inset">
      <svg viewBox="0 0 90 132" role="img" aria-label="Side view, schematic spine and belly">
        <circle className="side-head" cx="50" cy="14" r="9" />
        <path className="side-front" d={frontPath(flatten, flex)} />
        <path className="side-diaphragm" d={diaphragmSide(flatten)} />
        <path className="side-spine" d={spinePath(flex)} style={{ opacity: 0.65 + flex * 0.35 }} />
        <path className="side-pelvis" d="M38 118 C38 124 44 127 49 125 C52 123 52 118 49 115" />
      </svg>
      <figcaption>Side · the supported exhale draws a slight C-curve</figcaption>
    </figure>
  );
}
