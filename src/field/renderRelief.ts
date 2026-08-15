import { TORSO } from "../components/torsoPaths";
import type { FieldSite } from "./sites";
import {
  FALLOFF_RADIUS,
  FIELD_CEILING_MM,
  FIELD_COLS,
  FIELD_ROWS,
  HEIGHT_EXAGGERATION,
  LIGHT_X,
  LIGHT_Y,
  LIGHT_Z,
  RELIEF_ALPHA,
  RELIEF_YIELD,
} from "./tunables";

const VIEW_W = 240;
const VIEW_H = 250;

function tone(mm: number, ceiling: number): number {
  const t = Math.min(1, Math.max(0, mm / ceiling));
  return t * t * (3 - 2 * t);
}

function lightDir(): [number, number, number] {
  const len = Math.hypot(LIGHT_X, LIGHT_Y, LIGHT_Z) || 1;
  return [LIGHT_X / len, LIGHT_Y / len, LIGHT_Z / len];
}

export function buildTorsoMask(cols = FIELD_COLS, rows = FIELD_ROWS): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  const mask = new Uint8Array(cols * rows);
  if (!ctx) return mask;
  ctx.setTransform(cols / VIEW_W, 0, 0, rows / VIEW_H, 0, 0);
  ctx.fillStyle = "#fff";
  ctx.fill(new Path2D(TORSO));
  const data = ctx.getImageData(0, 0, cols, rows).data;
  for (let i = 0; i < mask.length; i++) {
    mask[i] = data[i * 4 + 3] > 16 ? 1 : 0;
  }
  return mask;
}

/**
 * Inverse-distance height field + Lambert shading.
 * Canvas is in viewBox space (240×250) at FIELD_COLS × FIELD_ROWS.
 */
export function paintRelief(
  ctx: CanvasRenderingContext2D,
  sites: FieldSite[],
  mask: Uint8Array,
  depth: number,
): void {
  const cols = ctx.canvas.width;
  const rows = ctx.canvas.height;
  const heights = new Float32Array(cols * rows);
  const sx = VIEW_W / cols;
  const sy = VIEW_H / rows;
  const R = FALLOFF_RADIUS;

  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) * sy;
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      if (!mask[idx]) continue;
      const x = (i + 0.5) * sx;
      let num = 0;
      let den = 0;
      for (const site of sites) {
        const d = Math.hypot(x - site.x, y - site.y);
        if (d >= R) continue;
        const t = 1 - d / R;
        const w = t * t;
        num += w * site.mm;
        den += w;
      }
      heights[idx] = den > 0 ? num / den : 0;
    }
  }

  const img = ctx.createImageData(cols, rows);
  const px = img.data;
  const [lx, ly, lz] = lightDir();
  const yieldA = depth >= 6 ? 1 : RELIEF_YIELD;
  const ex = HEIGHT_EXAGGERATION / Math.max(sx, sy);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      const o = idx * 4;
      if (!mask[idx]) continue;
      const h = heights[idx];
      const t = tone(h, FIELD_CEILING_MM);
      if (t < 0.02) continue;
      const il = i > 0 ? i - 1 : i;
      const ir = i < cols - 1 ? i + 1 : i;
      const ju = j > 0 ? j - 1 : j;
      const jd = j < rows - 1 ? j + 1 : j;
      const hx = (heights[j * cols + ir] - heights[j * cols + il]) * ex;
      const hy = (heights[jd * cols + i] - heights[ju * cols + i]) * ex;
      let nx = -hx;
      let ny = -hy;
      let nz = 1;
      const nlen = Math.hypot(nx, ny, nz) || 1;
      nx /= nlen;
      ny /= nlen;
      nz /= nlen;
      const lambert = Math.max(0, nx * lx + ny * ly + nz * lz);
      const shade = 0.3 + 0.7 * lambert;
      px[o] = Math.round(228 * shade);
      px[o + 1] = Math.round(184 * shade);
      px[o + 2] = Math.round(106 * shade);
      px[o + 3] = Math.round(255 * t * RELIEF_ALPHA * yieldA);
    }
  }

  ctx.putImageData(img, 0, 0);
}
