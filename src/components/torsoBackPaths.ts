/**
 * Schematic posterior figure, same viewBox as the front (0 0 240 250).
 * Silhouette reuses the front TORSO / NECK / arms — symmetric enough
 * at this fidelity. Ribs attach at the spine and run down and out.
 */

export const SPINE = "M120 66 L120 210";

export const VERTEBRA_YS: number[] = [];
for (let y = 70; y <= 206; y += 10) VERTEBRA_YS.push(y);

export const SCAPULA_L = "M88 78 L108 84 L102 112 L84 104 Z";
export const SCAPULA_R = "M152 78 L132 84 L138 112 L156 104 Z";

/** [spine attach Y, half-width, lateral Y] — back ribs drop as they widen. */
export const BACK_RIBS: [number, number, number][] = [
  [74, 30, 84],
  [86, 36, 98],
  [98, 38, 114],
  [112, 38, 132],
  [126, 36, 150],
  [138, 32, 164],
  [148, 28, 178],
];

export function backRibPair(
  attachY: number,
  halfWidth: number,
  lateralY: number,
): [string, string] {
  const rise = lateralY - attachY;
  const left = `M118 ${attachY} C${(120 - halfWidth * 0.38).toFixed(1)} ${(attachY + rise * 0.28).toFixed(1)} ${(120 - halfWidth * 0.78).toFixed(1)} ${(attachY + rise * 0.68).toFixed(1)} ${(120 - halfWidth).toFixed(1)} ${lateralY}`;
  const right = `M122 ${attachY} C${(120 + halfWidth * 0.38).toFixed(1)} ${(attachY + rise * 0.28).toFixed(1)} ${(120 + halfWidth * 0.78).toFixed(1)} ${(attachY + rise * 0.68).toFixed(1)} ${(120 + halfWidth).toFixed(1)} ${lateralY}`;
  return [left, right];
}
