/**
 * Anatomy layer manifest.
 *
 * Track G draws schematic SVG placeholders. Track H drops matching PNGs
 * into `public/anatomy/` using the filenames below; at runtime a loaded
 * image replaces the placeholder with no code change.
 *
 * Images must be framed to the torso SVG viewBox (0 0 240 250), alpha
 * background, isolated (one layer per file). Anchor table — keep these
 * pixels when re-rendering so compartments stay registered:
 *
 *   sternal notch   120, 66
 *   mid-sternum     120, 96
 *   xiphoid         120, 148
 *   umbilicus       120, 188
 *   costal margin L 100, 168
 *   costal margin R 140, 168
 *   lateral rib L    86, 118
 *   lateral rib R   154, 118
 */

export const ANATOMY_LAYER_IDS = [
  "skeleton",
  "deep",
  "intercostal",
  "ab_wall",
  "superficial",
  "surface",
] as const;

export type AnatomyLayerId = (typeof ANATOMY_LAYER_IDS)[number];

export type AnatomyDepth = 1 | 2 | 3 | 4 | 5 | 6;

export type AnatomyLayer = {
  id: AnatomyLayerId;
  /** Depth at which this layer reaches full opacity. */
  depth: AnatomyDepth;
  label: string;
  filename: string;
};

export const ANATOMY_LAYERS: AnatomyLayer[] = [
  { id: "skeleton", depth: 1, label: "Skeleton", filename: "skeleton.png" },
  { id: "deep", depth: 2, label: "Diaphragm & deep", filename: "deep.png" },
  { id: "intercostal", depth: 3, label: "Rib wall", filename: "intercostal.png" },
  { id: "ab_wall", depth: 4, label: "Abdominal wall", filename: "ab-wall.png" },
  { id: "superficial", depth: 5, label: "Chest & shoulder", filename: "superficial.png" },
  { id: "surface", depth: 6, label: "Body", filename: "surface.png" },
];

export const DEFAULT_ANATOMY_DEPTH: AnatomyDepth = 2;

export const ANATOMY_DEPTH_KEY = "somatic.anatomyDepth.v2";

export function layerHref(filename: string): string {
  const base = import.meta.env.BASE_URL;
  const root = base.endsWith("/") ? base : `${base}/`;
  return `${root}anatomy/${filename}`;
}

/**
 * Line art cannot occlude the way solid renders do, so "peel" means:
 * the selected depth's layer at full strength, deeper layers dimmed to
 * context, more-superficial layers hidden. Depth 1 keeps a diaphragm
 * hint (the teaching muscle) over bone.
 */
export function layerOpacity(id: AnatomyLayerId, depth: AnatomyDepth): number {
  if (id === "skeleton") return depth === 1 ? 1 : 0.4;
  if (id === "deep") {
    if (depth === 1) return 0.45;
    if (depth === 2) return 1;
    return 0.2;
  }
  if (id === "intercostal") {
    if (depth === 3) return 0.9;
    return depth > 3 ? 0.15 : 0;
  }
  if (id === "ab_wall") {
    if (depth === 4) return 0.9;
    return depth > 4 ? 0.3 : 0;
  }
  if (id === "superficial") {
    if (depth === 5) return 0.9;
    return depth === 6 ? 0.35 : 0;
  }
  if (id === "surface") return depth === 6 ? 0.32 : 0;
  return 0;
}

export function clampDepth(n: number): AnatomyDepth {
  const depth = Math.round(n);
  if (depth <= 1) return 1;
  if (depth >= 6) return 6;
  return depth as AnatomyDepth;
}

export function loadStoredDepth(): AnatomyDepth {
  try {
    const raw = localStorage.getItem(ANATOMY_DEPTH_KEY);
    if (!raw) return DEFAULT_ANATOMY_DEPTH;
    return clampDepth(Number(raw));
  } catch {
    return DEFAULT_ANATOMY_DEPTH;
  }
}

export function saveStoredDepth(depth: AnatomyDepth): void {
  try {
    localStorage.setItem(ANATOMY_DEPTH_KEY, String(depth));
  } catch {
    /* ignore quota / private mode */
  }
}
