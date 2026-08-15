import type { AnatomyLayerId } from "./layers";

/**
 * Muscle catalog — the roster is data so scripts stay sparse and the
 * composer can list clinical actions. Existing 9 ids keep their exact
 * spelling. New ids are additive.
 */
export type MuscleId =
  | "pelvic_floor"
  | "diaphragm"
  | "transversus"
  | "rectus"
  | "obliques"
  | "intercostals"
  | "scalenes"
  | "traps"
  | "platysma"
  | "pec_major"
  | "pec_minor"
  | "erector_iliocostalis"
  | "erector_longissimus"
  | "levatores_costarum"
  | "intertransversarii"
  | "rhomboids"
  | "subclavius";

export type MuscleRegion = "core" | "abdomen" | "rib_wall" | "chest" | "neck" | "back";
export type FigureAspect = "front" | "back";

export type MuscleDef = {
  id: MuscleId;
  label: string;
  region: MuscleRegion;
  aspects: FigureAspect[];
  layer: AnatomyLayerId;
  /** Clinical action, one sentence — shown in the composer picker. */
  action: string;
};

export const MUSCLES: MuscleDef[] = [
  {
    id: "pelvic_floor",
    label: "Pelvic floor (levator ani)",
    region: "core",
    aspects: ["front"],
    layer: "deep",
    action: "Lifts and supports the pelvic viscera; steadies the abdominal contents.",
  },
  {
    id: "diaphragm",
    label: "Diaphragm",
    region: "core",
    aspects: ["front"],
    layer: "deep",
    action: "Contracts and descends to enlarge the thorax; relaxes and domes on recoil.",
  },
  {
    id: "transversus",
    label: "Transversus abdominis",
    region: "abdomen",
    aspects: ["front"],
    layer: "deep",
    action: "Draws the abdominal wall inward and maintains resting tone around the viscera.",
  },
  {
    id: "rectus",
    label: "Rectus abdominis",
    region: "abdomen",
    aspects: ["front"],
    layer: "ab_wall",
    action: "Flexes the lumbar spine and draws the rib cage toward the pelvis.",
  },
  {
    id: "obliques",
    label: "Internal & external obliques",
    region: "abdomen",
    aspects: ["front"],
    layer: "ab_wall",
    action: "Rotate and side-bend the trunk; assist expiration by narrowing the waist.",
  },
  {
    id: "intercostals",
    label: "Intercostals",
    region: "rib_wall",
    aspects: ["front"],
    layer: "intercostal",
    action: "Change the distance between the ribs; the external set assists rib elevation.",
  },
  {
    id: "scalenes",
    label: "Scalenes",
    region: "neck",
    aspects: ["front"],
    layer: "superficial",
    action: "Elevate the first and second ribs and side-bend the neck.",
  },
  {
    id: "traps",
    label: "Trapezius (upper)",
    region: "chest",
    aspects: ["front", "back"],
    layer: "superficial",
    action: "Elevates and steadies the scapula; yields so the upper thorax can widen.",
  },
  {
    id: "platysma",
    label: "Platysma",
    region: "neck",
    aspects: ["front"],
    layer: "superficial",
    action: "Tenses the skin of the neck and draws the lower lip and jaw down.",
  },
  {
    id: "pec_major",
    label: "Pectoralis major",
    region: "chest",
    aspects: ["front"],
    layer: "superficial",
    action: "Adducts and medially rotates the arm; yields so the anterior chest can widen.",
  },
  {
    id: "pec_minor",
    label: "Pectoralis minor",
    region: "chest",
    aspects: ["front"],
    layer: "superficial",
    action: "Draws the scapula forward and down; assists elevation of ribs 3–5.",
  },
  {
    id: "erector_iliocostalis",
    label: "Iliocostalis (cervical part)",
    region: "back",
    aspects: ["back"],
    layer: "deep",
    action: "Extends and side-bends the cervical spine; steadies the upper ribs.",
  },
  {
    id: "erector_longissimus",
    label: "Longissimus cervicis",
    region: "back",
    aspects: ["back"],
    layer: "deep",
    action: "Extends and side-bends the cervical and upper thoracic spine.",
  },
  {
    id: "levatores_costarum",
    label: "Levatores costarum",
    region: "back",
    aspects: ["back"],
    layer: "intercostal",
    action: "Elevate the ribs at the back, assisting thoracic expansion.",
  },
  {
    id: "intertransversarii",
    label: "Intertransversarii",
    region: "back",
    aspects: ["back"],
    layer: "deep",
    action: "Connect adjacent transverse processes and steady segmental spinal motion.",
  },
  {
    id: "rhomboids",
    label: "Rhomboids",
    region: "back",
    aspects: ["back"],
    layer: "superficial",
    action: "Retract the scapula toward the spine and hold it against the rib cage.",
  },
  {
    id: "subclavius",
    label: "Subclavius",
    region: "chest",
    aspects: ["front"],
    layer: "superficial",
    action: "Draws the clavicle down and steadies it during arm and rib motion.",
  },
];

export const MUSCLE_IDS: MuscleId[] = MUSCLES.map((m) => m.id);

const BY_ID = Object.fromEntries(MUSCLES.map((m) => [m.id, m])) as Record<MuscleId, MuscleDef>;

export function muscleById(id: MuscleId): MuscleDef {
  return BY_ID[id];
}

export function isMuscleId(value: string): value is MuscleId {
  return value in BY_ID;
}
