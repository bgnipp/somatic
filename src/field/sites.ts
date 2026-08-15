import type { CompartmentId, Sample } from "../types";
import { COMPARTMENT_IDS } from "../types";

export type FieldSite = {
  x: number;
  y: number;
  mm: number;
  r: number;
};

/**
 * Stable centroids in the torso viewBox. Hardcoded so the field
 * stays registered to the current compartment paths.
 */
export const FIELD_CENTROIDS: Record<CompartmentId, { x: number; y: number; r: number }> = {
  rc_pulmonary_L: { x: 102, y: 96, r: 26 },
  rc_pulmonary_R: { x: 138, y: 96, r: 26 },
  rc_abdominal_L: { x: 103, y: 140, r: 20 },
  rc_abdominal_R: { x: 137, y: 140, r: 20 },
  abdomen_L: { x: 108, y: 186, r: 24 },
  abdomen_R: { x: 132, y: 186, r: 24 },
};

export function sitesFromSample(sample: Sample | null): FieldSite[] {
  if (!sample) return [];
  const sites: FieldSite[] = COMPARTMENT_IDS.map((id) => ({
    ...FIELD_CENTROIDS[id],
    mm: sample.compartments[id].displacementMm,
  }));
  if (sample.lateral) {
    sites.push({ x: 86, y: 118, r: 16, mm: sample.lateral.leftMm });
    sites.push({ x: 154, y: 118, r: 16, mm: sample.lateral.rightMm });
  }
  return sites;
}
