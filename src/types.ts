export const COMPARTMENT_IDS = [
  "rc_pulmonary_L",
  "rc_pulmonary_R",
  "rc_abdominal_L",
  "rc_abdominal_R",
  "abdomen_L",
  "abdomen_R",
] as const;

export type CompartmentId = (typeof COMPARTMENT_IDS)[number];

export type CompartmentSample = {
  displacementMm: number;
};

export type Sample = {
  t: number;
  compartments: Record<CompartmentId, CompartmentSample>;
  /** Optional mid-thorax laterals for the cross-section. Additive; older takes omit it. */
  lateral?: { leftMm: number; rightMm: number };
};

export type ProtocolId = "quiet_standing" | "sustained_phrase" | (string & {});

export type Session = {
  id: string;
  startedAt: string;
  durationMs: number;
  protocol: ProtocolId;
  scenario?: string;
  samples: Sample[];
  notes: string;
  /** Optional display name; falls back to the scenario label. */
  label?: string;
  /** Reserved for a future synchronized take. v0 does not record audio. */
  audio?: {
    mimeType: string;
    url?: string;
  };
};

export const PRESET_IDS = [
  "abdominal",
  "apical",
  "left_quiet",
  "asynchrony",
  "paradox",
  "frozen",
  "clavicular",
  "rib_collapse",
] as const;

export type PresetId = (typeof PRESET_IDS)[number];

export type Preset = {
  id: PresetId;
  label: string;
  family: "standing" | "singing";
  blurb: string;
  lookFor: string;
};

export const PRESETS: Preset[] = [
  {
    id: "abdominal",
    label: "Abdominal-dominant",
    family: "standing",
    blurb: "Belly moves, rib cage quieter, in phase.",
    lookFor: "Watch the lower map and the belly trace rise together.",
  },
  {
    id: "apical",
    label: "Chest-dominant",
    family: "standing",
    blurb: "Upper ribs move, abdomen quiet.",
    lookFor: "Upper map brightens; the belly trace stays small.",
  },
  {
    id: "left_quiet",
    label: "Left quieter",
    family: "standing",
    blurb: "Left lower ribs about 40% of the right. A conversation, not a diagnosis.",
    lookFor: "Compare the two lower-rib regions, then see if a cue changes the split.",
  },
  {
    id: "asynchrony",
    label: "Chest / belly offset",
    family: "standing",
    blurb: "Belly lags the chest. Timing, shown neutrally.",
    lookFor: "The Konno–Mead path opens into a loop instead of a line.",
  },
  {
    id: "paradox",
    label: "Paradoxical timing",
    family: "standing",
    blurb: "Belly and rib cage move opposite each other — reverse breathing, shown neutrally.",
    lookFor: "The belly trace peaks while the rib traces dip; the map alternates top and bottom.",
  },
  {
    id: "frozen",
    label: "One region still",
    family: "standing",
    blurb: "Left lower ribs nearly flat. The thing that is hard to feel.",
    lookFor: "One compartment stays dim while its neighbors move.",
  },
  {
    id: "clavicular",
    label: "Clavicular inhale",
    family: "singing",
    blurb: "Upper chest heaves on the intake — a common student pattern.",
    lookFor: "A sharp rise at the top of the map on each inhale.",
  },
  {
    id: "rib_collapse",
    label: "Rib collapse on phrase",
    family: "singing",
    blurb: "Ribs fall through a long exhale. Support letting go.",
    lookFor: "Rib traces drift down across the phrase instead of holding.",
  },
];

export const COMPARTMENT_LABELS: Record<CompartmentId, string> = {
  rc_pulmonary_L: "Upper ribs · left",
  rc_pulmonary_R: "Upper ribs · right",
  rc_abdominal_L: "Lower ribs · left",
  rc_abdominal_R: "Lower ribs · right",
  abdomen_L: "Abdomen · left",
  abdomen_R: "Abdomen · right",
};

export type Landmark = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export const LANDMARKS: Landmark[] = [
  { id: "sternal_notch", label: "Sternal notch", x: 120, y: 66 },
  { id: "mid_clav_L", label: "Mid-clavicle L", x: 100, y: 70 },
  { id: "mid_clav_R", label: "Mid-clavicle R", x: 140, y: 70 },
  { id: "mid_sternum", label: "Mid-sternum", x: 120, y: 96 },
  { id: "xiphoid", label: "Xiphoid", x: 120, y: 148 },
  { id: "costal_L", label: "Costal margin L", x: 100, y: 168 },
  { id: "costal_R", label: "Costal margin R", x: 140, y: 168 },
  { id: "lateral_L", label: "Lateral rib L", x: 86, y: 118 },
  { id: "lateral_R", label: "Lateral rib R", x: 154, y: 118 },
  { id: "umbilicus", label: "Umbilicus", x: 120, y: 188 },
];
