# Somatic Breath Map — MVP Plan

**Date:** 2026-08-14
**Status:** Phase 0 built and deployed (see status update below). This document remains the product thesis and constraints; newer work is planned in the follow-on docs.
**Source material:** `context/transcripts/2026-08-14-breath-measurement-conversation.txt` (kept local-only, not in the repo)

## Status update (2026-08-15)

**Current project state and the done-vs-remaining ledger live in `docs/roadmap.md` — read that first.** Summary as of this date: Phase 0 (mock studio) is built and live on GitHub Pages, and has grown past the original v0 scope:

- **Everything in the v0 table below ships:** six-compartment torso map, seven mock presets (the original five plus two singing-support presets), traces, Konno–Mead loop, record/replay/scrub, export/import, notes, compare view, live metrics (breaths/min, chest:belly, left:right, phase gap), URL-shareable scenarios.
- **Layered anatomy** (`docs/layered-anatomy-plan.md`): the figure now peels through six anatomical strata (skeleton → diaphragm & deep → rib wall → abdominal wall → chest & shoulder → body) via a depth rail, with schematic placeholder art; realistic Blender renders are a pending human task (Track H).
- **Motion field** (`docs/motion-field-plan.md`): a continuous interpolated motion view (`Regions | Field` toggle) rendered as a lit relief surface — the belly visibly swells with the breath. Therapist tuning pass (F3) pending.
- **Guide view shipped** (`docs/breath-animation-plan.md`): a model-driven teaching animation of the coordinated breath — Quiet breath and Supported breath, selectable — with red/blue activation tints, pelvic floor, and whole-figure oscillation. Clearly labeled as a reference loop, not the user's measurement. Physician review of the quiet-breath table is pending.
- **Next gate is unchanged:** put it in front of the therapist and run the success gate below before any capture work.

## One-line summary

A practitioner-mediated visualization tool: a person stands and breathes, and a screen shows which parts of their torso are moving, which are quiet, and whether regions are in phase — so a therapist can point at something the client can't yet feel. The first version uses **mock data only**; camera capture comes later, and only if the visualization proves it changes a session.

---

## What we are building (and what we are not)

### The product thesis

The idea worth protecting isn't the sensor stack — it's that **a person can be shown a part of themselves they cannot feel**. Somatic teaching cues like "breathe into your ribs" routinely fail because the client has no sensory access to the region and no shared vocabulary for the sensation. A live visual map gives the therapist a shared referent: point at the quiet region, touch the shoulder, breathe again, watch it change.

### Positioning: a practice tool, not a product (yet)

Honest viability read, so we don't fool ourselves:

- **As a one-room practice tool: strong.** Practitioner-mediated, in-session biofeedback sidesteps the failure mode that killed consumer breath wearables (novelty purchase → drawer → pivot or die). The therapist is the retention mechanism.
- **As a venture product: weak.** Somatic practitioners are numerous but individually low-budget — a few thousand realistic US buyers at $1–3k, high churn on anything needing calibration and lighting control. Pushing into clinics/PT reimbursement inherits the regulatory swamp.
- **As a "cheaper OEP/Thora-3Di": the framing that fails hardest.** Those systems are expensive because of clinical validation, regulatory clearance, and hospital sales — not cameras. A cheap clone is an uncleared device hospitals can't buy, aimed at buyers who don't want lung volumes.

**Success metric for the MVP:** does it measurably change what the therapist can teach (and charge) in one room with ~10 clients? Not whether we beat BTS on millimeters.

### Regulatory line (hard constraint)

All copy and UI language stays on the **"movement visualization and education"** side. The moment the tool claims to *assess breathing dysfunction*, it's a medical device. No diagnostic scores, no "normal/abnormal", no dysfunction language. If someone asks for a score: "this is a mirror, not a test."

---

## Prior art (why mock-first, and what capture to use later)

| System | How it works | Relation to this project |
|---|---|---|
| **OEP** (BTS; 89 markers, 8 IR cameras) | 3D marker coords → triangulated chest-wall volume; 3-compartment model (pulmonary rib cage, abdominal rib cage, abdomen) | Same geometry we want. Wrong buyer, wrong claim, wrong price. We borrow its compartment model. |
| **Thora-3Di** (structured light plethysmography) | Projected grid + two cameras → regional traces, live chest/abdomen and L/R correlation | Our biofeedback screen already exists — aimed at ICUs. Confirms the display concept ships. |
| **Single RGB + 4 torso markers** (published feasibility study) | 2D marker tracking → respiratory timing and thoraco-abdominal asynchrony indexes | This *is* our Phase 2 capture rig, already validated in a paper. Near-zero tech moat; defensibility is the workflow, not the capture. |
| **RIP / piezo belts** | Circumference → voltage, chest + abdomen bands | Cheap breath-phase ground truth. No spatial map. Companion sensor, not the product. |
| **Eulerian video magnification** | Amplifies tiny motions in ordinary video | Right for *showing*, wrong for *measuring*. Optional Phase 1 overlay. |

### Accuracy reality check

- Quiet-breathing chest-wall displacement: **~1–12 mm**
- Marker-based optical tracking error: **0.5–1.5 mm** ✔
- Depth / time-of-flight cameras: **~2–8 mm** (middle ground; clothing/lighting sensitive) ~
- Markerless pose estimation (MediaPipe/OpenPose): **5–20 mm** ✘ — the noise floor *is* the signal

**Conclusion:** pose estimation is ruled out for measurement, permanently. Later capture is markers or depth. And since even the right capture rig can't answer "does the picture create feeling?", v0 fakes the signal entirely and tests the visual language first.

### The hard problem is meaning, not measurement

Even with perfect capture, we'd get "left lower ribs move 3 mm less than right" — and there's no normative database for somatic breathing patterns, no evidence that changing the asymmetry helps, and no shared vocabulary. Mock data lets us test whether the picture creates feeling **before** proving the picture is true.

---

## v0 scope (mock studio)

A local web app, no backend, that the therapist and client look at together on one screen.

### In scope

- **Six compartments** (OEP model split left/right): pulmonary rib cage L/R, abdominal rib cage L/R, abdomen L/R
- **2D SVG torso map** (front view), regions brighten/expand with displacement, ~30 fps
- **MockBreathSource**: coupled sinusoids + noise, driven by scenario presets
- **Therapist trace panel**: chest vs belly, left vs right, phase/asynchrony over time
- **Record / replay**: capture a 30–60 s take, scrub it, replay it
- **Export**: session JSON to file; persistence via localStorage
- **Scenario picker** so the therapist can teach with named patterns ("this is what a quiet left lower rib looks like")

### Out of scope for v0 (explicit)

- Camera, markers, stereo, depth — all capture
- 3D mesh / Three.js — compartments are the unit, not a surface
- Lung volume computation (that's the clinical product; ours is relative excursion + phase)
- Pose estimation (ruled out even later — see accuracy table)
- Accounts, cloud, sync
- EMG / ultrasound / "activation" (we measure displacement in space; contraction is a different question). *2026-08-15 note: activation now appears in plans as a scripted teaching animation (`docs/breath-animation-plan.md`) — modeled, clearly labeled, never presented as the user's measurement. The measurement exclusion stands.*
- Head position tracking (later overlay, not v0)
- Any diagnostic scoring or normative comparison

### Mock scenario presets

These are teaching presets, not diagnoses. If the therapist can't tell them apart on the wall, the visual language has failed and better capture won't save it.

| Preset | Fake signal behavior | Why it exists |
|---|---|---|
| Abdominal-dominant | Belly excursion large, rib cage small, in phase | The "breathe into your belly" cue, working |
| Apical / chest-dominant | Upper rib cage large, abdomen quiet | The cue that doesn't land |
| Left quiet | Left abdominal rib cage ~40% of right | Asymmetry you can point at, then touch |
| Thoraco-abdominal asynchrony | Belly lags chest by ~90° | Timing, not just amplitude |
| Frozen region | One compartment near-flat with residual noise | The thing people can't feel until they see it |

---

## Data contract

Locked in v0 so that a real capture source later is a swap, not a rewrite. Displacement (mm from rest, surface-normal), never volume. Dynamic time-series, never a single frame — per the source conversation, a snapshot is *not* representative; "it would have to be dynamic," but a short window of quiet standing tells you "a lot, enough."

```ts
type CompartmentId =
  | "rc_pulmonary_L" | "rc_pulmonary_R"
  | "rc_abdominal_L" | "rc_abdominal_R"
  | "abdomen_L" | "abdomen_R";

type Sample = {
  t: number; // ms since session start, ~30 Hz
  compartments: Record<CompartmentId, { displacementMm: number }>;
};

type Session = {
  id: string;
  startedAt: string; // ISO
  durationMs: number;
  protocol: "quiet_standing"; // only protocol in v0
  scenario?: string; // mock preset name, absent for real capture
  samples: Sample[];
  notes: string;
};

interface BreathSource {
  start(): void;
  stop(): void;
  subscribe(cb: (sample: Sample) => void): () => void;
}
```

v0 ships `MockBreathSource`. Phase 2 adds `MarkerCameraSource` or a depth source behind the same interface. Session JSON is the interchange format.

---

## Build phases

### Phase 0 — Mock studio (this is the MVP)

| Piece | Decision | Done when |
|---|---|---|
| App shell | Vite + React + TypeScript, no backend | `npm run dev` opens a full-screen studio |
| Torso map | 2D SVG, six regions | Regions pulse with the live sample |
| MockBreathSource | Coupled sinusoids + noise + presets | All five presets play without a camera |
| Traces | Chest vs belly, L vs R, asynchrony | A 30 s recording can be scrubbed |
| Record / replay / export | localStorage + JSON download | Stop a take, replay it, export the file |

Estimated effort: a few days.

### Phase 1 — Session workflow (only if Phase 0 lands)

- Before/after clips: breathe → therapist touches shoulder → breathe again → compare side by side
- Therapist notes attached to sessions
- Relative regional scores (never "normal/abnormal")
- Optional: Eulerian motion magnification as a *show* layer on ordinary video — never a *measure* layer

### Phase 2 — Real capture (only if the success gate passes)

- **First rig:** 4 high-contrast markers + 1 RGB camera (~$20–200) — matches the published feasibility setup; recovers timing and asynchrony
- **Alternate:** depth camera / iPhone LiDAR ($0–400 if a phone is on hand)
- **Companion:** RIP or piezo belt ($50–300) as breath-phase ground truth to phase-lock the map
- Same UI, new `BreathSource` implementation
- **Later candidates, not now:** force plate for breath-driven postural sway during quiet standing; mmWave radar (~$300 dev board) for contactless point displacement through clothing
- **Never:** MediaPipe/OpenPose for measurement

---

## Success gate (before buying any camera)

Put the mock studio in front of the therapist and a handful of clients for a few sessions. Do not start Phase 2 unless most of these are true:

1. **Preset discrimination:** the therapist can tell the five presets apart on the wall in a few seconds, without reading the traces. *Fail: the map is pretty and meaningless — stop.*
2. **Felt sense:** a client at least sometimes reports feeling a region after seeing it, especially after a touch. *Fail: it's a gadget; accuracy won't fix that.*
3. **Changed practice:** the therapist actually does something different — points, waits, touches, re-records. *Fail: it's a second screen she ignores.*
4. **No score demand:** nobody needs a diagnostic number. *If they do and we add one, we're building a device.*

---

## Cost envelope

| When | What | Money |
|---|---|---|
| v0 | Laptop + this app | $0 |
| Phase 2a | Webcam + tape/stickers + optional RIP belt | ~$20–300 |
| Phase 2b | RealSense or phone LiDAR | $0–400 |
| Fixed one-room rig (only if it's earning its keep) | Cameras, mounts, lighting | low $1000s |

Right budget for a practice tool; wrong budget for a company. Keep it that way until the success gate says otherwise.

---

## Open questions (parked, not blocking)

- Front-view-only map vs adding a back view (OEP uses 42 posterior markers for a reason; posterior rib motion may matter for teaching)
- Whether "installation mode" (a public room where people watch their own breath on a wall) is a cheaper way to test the visual layer on hundreds of bodies than one-on-one sessions
- What the therapist's vocabulary for the presets should actually be — she names them, not us
