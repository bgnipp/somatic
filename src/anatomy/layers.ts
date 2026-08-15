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
  "superficial",
  "surface",
] as const;

export type AnatomyLayerId = (typeof ANATOMY_LAYER_IDS)[number];

export type AnatomyDepth = 1 | 2 | 3 | 4 | 5;

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
  { id: "superficial", depth: 4, label: "Surface muscle", filename: "superficial.png" },
  { id: "surface", depth: 5, label: "Body", filename: "surface.png" },
];

export const DEFAULT_ANATOMY_DEPTH: AnatomyDepth = 2;

export const ANATOMY_DEPTH_KEY = "somatic.anatomyDepth.v1";

export function layerHref(filename: string): string {
  const base = import.meta.env.BASE_URL;
  const root = base.endsWith("/") ? base : `${base}/`;
  return `${root}anatomy/${filename}`;
}

/**
 * Isolated-stack opacities. Deeper layers stay visible underneath.
 * Depth 1 keeps a hint of the diaphragm (the teaching muscle) over bone.
 * Surface is a wash, never a hide.
 */
export function layerOpacity(id: AnatomyLayerId, depth: AnatomyDepth): number {
  if (id === "skeleton") return 1;
  if (id === "deep") return depth <= 1 ? 0.42 : 1;
  if (id === "intercostal") return depth >= 3 ? 0.9 : 0;
  if (id === "superficial") return depth >= 4 ? 0.85 : 0;
  if (id === "surface") return depth >= 5 ? 0.32 : 0;
  return 0;
}

export function clampDepth(n: number): AnatomyDepth {
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  return 5;
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
