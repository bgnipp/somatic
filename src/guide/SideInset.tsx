import type { GuideScript } from "./script";

/**
 * Schematic sagittal inset for the Guide view — sagittal mechanics the front
 * view cannot show. Renders when the script defines `sideCaption`. Two
 * mechanics live here:
 *   - `spineFlex` > 0: the slight C-curve of the supported active exhale
 *     (spine bows forward); < 0: the spine lengthens toward straight.
 *   - `sternumLift`: upper sternum moves forward and up while the lowest
 *     ribs draw back — the rib-lengthening coordination.
 * Body faces left.
 */

function spinePath(flex: number, lift: number): string {
  const f = flex * 5;
  const topY = 30 - lift * 3;
  return `M48 ${topY.toFixed(1)} C${(46 - f * 0.7).toFixed(1)} 46 ${(43 - f).toFixed(1)} 64 ${(43 - f * 0.7).toFixed(1)} 82 C${(43 - f * 0.25).toFixed(1)} 100 45 110 45 120`;
}

function frontPath(flatten: number, flex: number, lift: number): string {
  const belly = 3 + flatten * 4.5;
  const chestX = 33 - flex * 2 - lift * 1.8;
  const topY = 28 - lift * 3;
  // Lowest ribs draw back (toward the spine) as the sternum lifts.
  const lowRibX = 30 + lift * 2.5;
  return `M44 ${topY.toFixed(1)} C${chestX.toFixed(1)} ${(36 - lift * 2).toFixed(1)} ${(chestX - 3).toFixed(1)} 50 ${lowRibX.toFixed(1)} 62 C${(27 - belly * 0.5 + lift * 1.5).toFixed(1)} 74 ${(26 - belly).toFixed(1)} 86 ${(29 - belly * 0.6).toFixed(1)} 98 C31 108 37 116 43 120`;
}

function diaphragmSide(flatten: number): string {
  const drop = flatten * 6;
  return `M31 ${(66 + drop).toFixed(1)} C36 ${(61 + drop).toFixed(1)} 41 ${(62 + drop).toFixed(1)} 44 ${(67 + drop).toFixed(1)}`;
}

export function SideInset({ script, phase }: { script: GuideScript; phase: number }) {
  const flex = script.spineFlex(phase);
  const flatten = script.diaphragmFlatten(phase);
  const lift = script.sternumLift(phase);
  return (
    <figure className="side-inset">
      <svg viewBox="0 0 90 132" role="img" aria-label="Side view, schematic spine and belly">
        <circle className="side-head" cx="50" cy={(14 - lift * 2).toFixed(1)} r="9" />
        <path className="side-front" d={frontPath(flatten, flex, lift)} />
        <path className="side-diaphragm" d={diaphragmSide(flatten)} />
        <path
          className="side-spine"
          d={spinePath(flex, lift)}
          style={{ opacity: 0.65 + Math.abs(flex) * 0.35 }}
        />
        <path className="side-pelvis" d="M38 118 C38 124 44 127 49 125 C52 123 52 118 49 115" />
      </svg>
      <figcaption>{script.sideCaption}</figcaption>
    </figure>
  );
}
