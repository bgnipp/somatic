# Muscle Catalog, Back View & Composer — Implementation Plan

**Date:** 2026-08-15
**Status:** Planned, not started. Written for agent handoff; each phase is independently commit-able.
**Sources:** The physician's in-flight messages of 2026-08-15 (`context/transcripts/2026-08-15-physician-inflight-muscle-roster.txt`, screenshots in `context/muscle-roster/`), assessed in `docs/breath-animation-plan.md` §Physician follow-up #2. Her three asks, in her words:

1. *"See how in the BT osteopathy animation the pec minor assists with breathing, the pec major assists by relaxing."*
2. *"The animation needs to include every muscle listed … we can input the action of each muscle to make visualization accurate — this is the minutia required."*
3. *"Once we put in all relevant anatomy and define their movements we will select a group of muscles to engage and activate, they will light up in the order selected (same with group of relaxing muscles)."*

## Shape of the work

Three features that build on each other, plus one prerequisite refactor:

- **C1 — Muscle catalog (refactor):** move the muscle roster from a hard-coded union type to a data catalog with per-muscle metadata (label, region, figure aspect, clinical action text). Scripts become sparse. This is the "input the action of each muscle" foundation and it unblocks everything after.
- **C2 — Pec pair:** her explicit example, front-view visible today. Small.
- **C3 — Back figure:** a schematic posterior view, Guide-only, because her roster (iliocostalis, longissimus, intertransversarii, levatores costarum) is invisible from the front.
- **C4 — Composer:** the authoring mode — pick an engage group and a relax group, ordered; the app compiles the selection into a script and plays it, muscles lighting **in the order selected**.
- **C5 — Polish + docs.**

Human gates (do not block C1–C2 on these; they gate parts of C3–C4 marked below):

- **BT osteopathy animation link** from the physician — needed before encoding muscle actions beyond the pec pair. The pec pair itself is safe: she stated it directly.
- **Back-view scope confirmation** at the review session. C3 ships schematic and is easy to iterate; if she wants different posterior muscles, that's a paths edit, not an architecture change.

## Agent orientation (current facts, verified 2026-08-15)

- Stack: React + TypeScript + Vite, zero runtime deps beyond React. `npm run build` must pass per phase; check wide and ~420 px layouts. GitHub Pages base `/somatic/`. Commit per phase, one-line messages in `git log` style; push when all phases build clean.
- `src/guide/script.ts` — `GuideStructureId` union (9 ids), `ActivationFn`, `GuideScript` with `activations: Record<GuideStructureId, ActivationFn>` (dense — every script names every structure), geometry drivers (`diaphragmFlatten`, `ribExpand`, `pelvicLift`, `spineFlex`, `ribLift`, `sternumLift`), optional `sideCaption`. Three scripts: `quiet`, `supported`, `lengthen`. Storage key `somatic.guideScript.v1`. `activationsAt(script, phase)` samples the record.
- `src/anatomy/placeholders.tsx` — all schematic front art. `STRUCTURE_CLASSES: Record<GuideStructureId, string>` maps structure → CSS class; `TintFill`/`TintStroke` render `activationColor(a)` overlays; `act(activations, id)` reads a `Partial` record already (placeholders are tolerant of missing keys).
- `src/anatomy/layers.ts` — 6-layer front manifest, `AnatomyDepth = 1..6`, `layerOpacity()`, `somatic.anatomyDepth.v2`.
- `src/components/TorsoMap.tsx` — owns Guide state (`scriptId`, `paused`, `scrub`), samples drivers per frame, renders `AnatomyStack` + `ScaleneHints` + `SideInset` (when `script.sideCaption`), `ScriptToggle`, `GuideLegend`, pause/scrub controls. Keyboard: `g`, `v`, `[`, `]` here; space/arrows in `App.tsx`. **Taken keys: space, arrows, `[`, `]`, `v`, `g`.**
- `src/components/torsoPaths.ts` — front silhouette paths (`TORSO`, `NECK`, arms, clavicles, costal arch) + compartment `PATHS`.
- `src/lib/color.ts` — `activationColor(a)`: red/blue, alpha 0→1 with activation strength.
- Language guardrails: education not assessment. Allowed: "contracting", "relaxing", "tone", "reference animation". Forbidden: "correct/incorrect", "should", "weak", "tight", "dysfunction", "heat". The legend sentence "Reference animation — not your data." stays mandatory in Guide view.
- Red/blue never leaks into Regions/Field; gold never renders in Guide.

---

## C1 — Muscle catalog

**Goal:** the roster becomes data; scripts become sparse; nothing visible changes.

New file `src/anatomy/catalog.ts`:

```ts
import type { AnatomyLayerId } from "./layers";

/** Existing 9 ids keep their exact spelling — stored scripts and
 *  STRUCTURE_CLASSES keys must not break. New ids are additive. */
export type MuscleId =
  // existing
  | "pelvic_floor" | "diaphragm" | "transversus" | "rectus" | "obliques"
  | "intercostals" | "scalenes" | "traps" | "platysma"
  // C2
  | "pec_major" | "pec_minor"
  // C3 (posterior roster from her screenshots)
  | "erector_iliocostalis" | "erector_longissimus"
  | "levatores_costarum" | "intertransversarii"
  | "rhomboids" | "subclavius";

export type MuscleRegion = "core" | "abdomen" | "rib_wall" | "chest" | "neck" | "back";
export type FigureAspect = "front" | "back";

export type MuscleDef = {
  id: MuscleId;
  label: string;                 // "Iliocostalis (cervical part)"
  region: MuscleRegion;          // grouping for the composer picker
  aspects: FigureAspect[];       // which figure(s) can show it
  layer: AnatomyLayerId;         // depth stop where its art lives (front),
                                 // reused as a grouping hint on the back figure
  /** Clinical action, one sentence — her "input the action of each muscle".
   *  Shown in the composer picker; neutral anatomical language only. */
  action: string;
};

export const MUSCLES: MuscleDef[]; // full table, one row per id
export const MUSCLE_IDS: MuscleId[];
export function muscleById(id: MuscleId): MuscleDef;
```

Action strings come from standard clinical definitions (e.g. iliocostalis cervicis: "Extends and side-bends the cervical spine; steadies the upper ribs." — origin/insertion facts are in her screenshot for that one). Keep each to one sentence; these render in the composer UI, so guardrail wording applies.

Refactor (mechanical, no behavior change):

1. `GuideStructureId` becomes a re-export: `export type GuideStructureId = MuscleId;` (keep the name so existing imports compile; new code uses `MuscleId`).
2. `GuideScript.activations` becomes `Partial<Record<MuscleId, ActivationFn>>`. `activationsAt` iterates `MUSCLE_IDS` and fills 0 for missing entries — the three scripts then delete their explicit `constant(0)` rows (the `lengthen` script's activations become `{}`).
3. `STRUCTURE_CLASSES` in `placeholders.tsx` re-keys to `Partial<Record<MuscleId, string>>` (back-only muscles have no front class yet; C3 adds back classes in its own table).

*Accept C1:* build clean; Guide view pixel-identical for all three scripts (spot-check supported at depth 2 and 5); `MUSCLES` has all 17 rows with action text; no UI change. Commit.

## C2 — Pec pair in the supported script

Her stated choreography: **pec minor assists inhalation (contracts, red); pec major assists by relaxing (blue).**

1. **Art:** `SuperficialLayer` currently draws 4 `anatomy-pec` paths (the major). Split: the existing paths become `pec_major`; add two small schematic `pec_minor` wedges beneath/above them — from ribs 3–5 area (~(98–108, 96–118) left, mirrored right) angling up toward the coracoid (~(92, 74) / (148, 74)), class `anatomy-pec-minor`, thinner stroke, visible when the superficial layer is (depth ≥ 5).
2. **Tints:** wire both through the `STRUCTURE_CLASSES`/tint machinery like the traps.
3. **Script:** supported only —
   - `pec_minor: (phase) => inhaleWave(phase, supportedInhale) * 0.5` (accessory: subtler than intercostals),
   - `pec_major: (phase) => { const p = wrapPhase(phase); return p < supportedInhale ? -Math.sin((p / supportedInhale) * Math.PI) * 0.6 : 0; }` (relaxes through the inhale, like the traps).
   - Quiet and lengthen: omit (sparse = neutral). Accessory muscles stay out of a quiet breath.
4. `public/anatomy/README.md`: superficial.png now includes pec minor.

*Accept C2:* in Guide · Supported at depth 5, pec major tints blue on inhale while pec minor tints red, and both go quiet in Quiet breath; no change in measured views; build clean. Commit.

## C3 — Back figure (schematic, Guide-only)

**Goal:** her posterior roster becomes visible. The measured views stay front-only (the mock data contract is anterior displacement — a back figure there would imply data we don't have).

1. **Paths:** new `src/components/torsoBackPaths.ts`. Reuse `TORSO`, `NECK`, and arm paths (the silhouette is symmetric enough at schematic fidelity); add:
   - `SPINE`: midline path with vertebra tick marks (~14 ticks, y 66→210).
   - `SCAPULA_L/R`: two triangular blades, ~(84–108, 76–112) mirrored.
   - Posterior ribs: reuse the `RIBS` table geometry mirrored about the midline (back ribs angle downward laterally — flip the arc curvature sign).
2. **Art:** new `src/anatomy/backPlaceholders.tsx`, one flat group (no depth stops on the back for now — the depth rail hides in back aspect):
   - `erector_iliocostalis` + `erector_longissimus`: two parallel muscle columns each side of the spine (iliocostalis lateral, longissimus medial), y 70–200, drawn as long tapered strips with 3–4 fiber lines. Classes `anatomy-erector-il`, `anatomy-erector-lo`.
   - `levatores_costarum`: short diagonal fans from transverse processes to the rib below, 6 hints per side, upper/mid thorax.
   - `intertransversarii`: small tick-pairs between adjacent transverse processes, cervical/upper thoracic — deliberately tiny; they read as texture, matching reality.
   - `rhomboids`: two parallelogram sheets from the spine (y 78–110) to each scapula's medial border.
   - `traps` (posterior full diamond): neck base → shoulders → mid-thoracic point. The front view keeps its small upper-trap wedges; both map to the same `traps` muscle id, so one activation drives both aspects.
   - `subclavius`: front-aspect muscle (under the clavicle) — add its small front hint in `SuperficialLayer` here rather than C2, class `anatomy-subclavius`.
   - Export `BACK_STRUCTURE_CLASSES: Partial<Record<MuscleId, string>>` and reuse `TintFill`/`TintStroke`.
3. **Aspect toggle:** Guide-only state `aspect: "front" | "back"` in `TorsoMap` (persist `somatic.guideAspect.v1`). UI: small two-pill toggle ("Front | Back") next to the script pills; key `b` (untaken), same input guard. Leaving Guide view always returns to front. In back aspect: `AnatomyStack` and front-only extras (`ScaleneHints`, landmarks, compartment hit-paths, `SideInset`) don't render; `BackFigure` renders inside the same `torso-breathe` group so the whole-figure oscillation and `ribExpand`/`ribLift` still breathe (thread the same props; posterior ribs use the same width/lift scaling).
4. **Choreography:** posterior muscles get script rows only where physiology is uncontroversial without the BT video: erector columns carry quiet postural tone in `supported` (`constant(0.15)`); levatores costarum assist rib elevation on inhale (`inhaleWave * 0.3`); the rest stay sparse (neutral) until her review / the BT link. The composer (C4) is where these muscles become fully usable regardless.

*Accept C3:* `b` and the pill flip aspects in Guide; the back figure oscillates with the script; traps tint on both aspects from the one activation; roster muscles are each visibly distinct at rest; Regions/Field unaffected (no aspect toggle offered there); both breakpoints; build clean. Commit.

## C4 — Composer ("light up in the order selected")

**Goal:** her authoring flow. A composition is data; it compiles to a `GuideScript`; the renderer stays untouched.

New file `src/guide/composer.ts`:

```ts
import type { MuscleId } from "../anatomy/catalog";
import type { GuideScript } from "./script";

export type Composition = {
  engage: MuscleId[];   // ordered — index = onset order
  release: MuscleId[];  // ordered
  holdMs: number;       // default 6000, full-cycle length incl. settle
};

export const COMPOSITION_KEY = "somatic.composition.v1";
export function loadComposition(): Composition;      // validated vs MUSCLE_IDS
export function saveComposition(c: Composition): void;

/** Compile: engage[i] ramps to +1 starting at phase i * stagger; release[i]
 *  ramps to −1 on the same stagger. stagger = min(0.08, 0.5 / max(len)).
 *  All curves hold once lit, then everything eases back to 0 over the last
 *  20% of the cycle. Geometry derived from membership:
 *  diaphragm engaged → diaphragmFlatten follows its ramp; intercostals or
 *  levatores_costarum engaged → ribExpand follows theirs (×0.8);
 *  pelvic_floor engaged → pelvicLift (+) / released → pelvicLift (−);
 *  everything else → geometry stays at rest. */
export function compileComposition(c: Composition): GuideScript;
// returns { id: "custom", label: "Composed", blurb: "Your selection — muscles light in the order chosen.", ... }
```

`GuideScriptId` gains `"custom"`. `scriptById` returns the compiled composition for `"custom"` (TorsoMap holds the compiled object in state and recompiles on composition change — memoize on the composition object).

**UI** — new `src/guide/ComposerPanel.tsx`, rendered in Guide view when the `custom` script pill is selected (the pill row becomes `Quiet | Supported | Rib lengthening | Compose`):

1. **Picker:** muscles from `MUSCLES` grouped by `region`, each row = label + its one-sentence `action` (her minutia, on screen). Two add buttons per row: "engage" / "release". A muscle can be in only one list; adding to the other moves it.
2. **Sequence lists:** two ordered chip rows ("Engage — in order" / "Release — in order") with per-chip remove (✕) and drag-free reorder via ◂ ▸ buttons (no drag-and-drop dependency).
3. Selecting a back-only muscle auto-flips the aspect toggle to back (and front-only ↔ front) so the lit muscle is never invisible; if the two lists span both aspects, the user flips manually with `b` — the aspect toggle stays available.
4. Composition persists on every change; pause/scrub work unchanged (the compiled script is a script like any other).
5. Empty composition: the figure rests; the panel shows "Add muscles to build a sequence." — no special-cased renderer states.

*Accept C4:* build a 3-engage/2-release sequence spanning both aspects; muscles visibly light in selection order with the stagger; reorder buttons change the order on the next loop; reload restores the composition; the three canonical scripts are untouched; pause/scrub/reduced-motion work on `custom`; build clean. Commit.

## C5 — Polish + docs

1. Tint alpha pass over the back figure (dark strokes need the same legibility care as G3's lesson: tint must not bury line art).
2. Narrow layout: composer picker collapses to an accordion by region; chip rows wrap.
3. Update `docs/breath-animation-plan.md` (follow-up #2 section → implemented status), `docs/roadmap.md` (move C-track to done; human items: BT link still wanted for richer default curves, her review of back-figure art and composer flow), `public/anatomy/README.md` (note: back-figure renders are a future Track H addition, filenames `back-*.png` reserved).
4. Full regression: all presets in Regions/Field, three scripts + custom in Guide, both aspects, both breakpoints, reduced motion. Push.

*Accept C5:* clean build pushed; roadmap reflects reality; no regressions.

## Deliberately out of scope

- **Encoding detailed actions for the posterior roster into canonical scripts** — blocked on the BT video link and her review; the composer covers her workflow meanwhile.
- **Back aspect in measured views** — no posterior data exists; adding the figure there would imply measurement we don't have (see `docs/motion-field-plan.md` guardrails).
- **Back-figure depth stops / Track H back renders** — flat schematic first; peel comes with real renders.
- **Composition sharing (URL/JSON export)** — nice-to-have after she validates the flow.

## Open questions for the physician (carried into the review session)

1. Link to the **BT osteopathy animation** (gates richer default curves for the posterior roster and pec-minor detail).
2. Back-figure roster/art review: are the erector columns, levatores, intertransversarii, rhomboids drawn and grouped the way she teaches?
3. Composer flow: does select-order-as-light-order match her intent, or does she want explicit per-muscle timing ("minutia" may eventually mean editable onsets)?
