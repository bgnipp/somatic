# Breath Anatomy Animation ("Guide" view) — Physician Feedback, Assessment, Implementation Spec

**Date:** 2026-08-15 (revised same day from assessment-only to handoff-ready)
**Status:** Implemented (B1–B4), plus her iMessage follow-up edits (solid-at-full activation gradient, exhale rib depression, SCM). Remaining work is her review of the quiet-breath choreography table — not code.
**Sources:** Voice memo from the physician ("breath animation", 3.3 min) — full transcript preserved at `context/transcripts/2026-08-15-physician-voice-memo-breath-animation-edits.txt` — plus three YouTube shorts she sent (assessed below; captions preserved at `context/transcripts/2026-08-15-physician-youtube-shorts-captions.txt`), plus a fourth, longer video she endorsed as "right on" (assessed below; captions at `context/transcripts/2026-08-15-physician-youtube-rib-unbunching-captions.txt`).

## What she asked for, in her words (condensed)

- Overall look: like the **Essential Anatomy 3D** app (the same app our `context/anatomy-layers/` screenshots and peel video come from).
- **The entire animation should oscillate** — muscles and ribs visibly expand and settle with the breath, not just overlays lighting up on a static figure.
- Include **the pelvic floor** in the layer stack.
- Show **which muscles relax during inhalation and which contract during exhalation**, using the heat-signature style of the Paul G "Schrödinger's Equation Animation" video (our existing `context/motion-field/` reference): **activating muscles turn red, relaxing muscles turn blue**.
- Her choreography of the breath:
  - The breath **starts with engaging the pelvic floor** and the diaphragm pulling down, "squishing the abdominal contents closer together."
  - **While the diaphragm relaxes, the rectus contracts** (exhale).
  - **Transversus always maintains tone.**
  - The most external muscles — **traps and rhomboids — relax** to let the thoracic cavity expand.
  - Muscles to show relaxing/activating: **levators (pelvic floor), transversus, internal & external obliques, intercostals, scalenes, platysma.**
- Use the **clinical definition of each muscle's action** to frame the coordination.

## Assessment — what this actually is

This is not an edit to the motion map. It is a **third stage view**: a choreographed, model-driven teaching animation of the coordinated breath — "how a breath works," played on the layered anatomy figure. It differs from everything built so far in one fundamental way:

**Muscle activation is modeled, not measured.** Displacement (our current signal) is observable by camera; activation state (contracting vs relaxing) is not — that would need sEMG. So this animation cannot and must not present itself as biofeedback. It is a reference loop, like the Essential Anatomy app itself: canonical, scripted, always the same. That's fine — arguably it's the missing half of the product. The teaching mirror shows *your* breath; this shows *the* breath.

This framing resolves the red/blue color question cleanly:

- **Measured views (Regions, Field): gold only, unchanged.** Brightness = motion. The single-channel guardrail in `docs/motion-field-plan.md` stands — in a measurement view, red/blue would smuggle in "good/bad."
- **Guide view (this feature): red/blue is correct.** Red = contracting, blue = relaxing/lengthening is a standard physiological convention (her explicit request), the data is a script rather than a measurement, and a persistent on-screen legend states the semantics. No assessment language; "contracting/relaxing" are the only words.

### Assessment of the three videos she sent

1. **Scapular glide** ([youtube.com/shorts/1V8PDPoxFT4](https://www.youtube.com/shorts/1V8PDPoxFT4)) — scapula gliding on the rib cage; serratus anterior, levator scapulae, rhomboids. **Directly relevant.** It supports her "traps and rhomboids relax" point: the shoulder girdle rides *on* the rib cage, so girdle tension caps rib expansion — a core singing-technique issue (shoulder/clavicular breathing). Implication: the superficial layer gains schematic upper-trap outlines, animated relaxing (blue) on inhale.
2. **Flail chest / paradoxical motion** ([youtube.com/shorts/RPWhYBFt2N8](https://www.youtube.com/shorts/RPWhYBFt2N8)) — a chest-wall segment moving *opposite* to the rest, plus a clear explanation of diaphragm → negative intrathoracic pressure → airflow. The trauma is irrelevant; the **concept of paradoxical (direction-reversed) motion is very relevant**: "reverse breathing" is one of the most common patterns a somatic teacher corrects, and our data contract is magnitude-only today. Logged in `docs/roadmap.md` backlog (signed displacement + reverse-breather preset) — **not part of this spec.**
3. **Nanolive growth cone** ([youtube.com/shorts/SngXAGa4_as](https://www.youtube.com/shorts/SngXAGa4_as)) — label-free microscopy of undulating cell motion. No feature content; it sets the **aesthetic bar**: subtle, continuous, organic. Gentle oscillation, not a bouncy cartoon.

### Fourth video — rib-cage geometry ("Unbunch Your Ribs", endorsed as "right on", 2026-08-15)

["Unbunch Your Ribs to Set the Conditions for Full Thoracic Breathing"](https://www.youtube.com/watch?v=Io6sKFSk-0Y) (6 min, Alexander Technique / Jan Masoero lineage). Full captions preserved in `context/transcripts/`. This one is different in kind from the shorts: it is about the **habitual static shape of the rib cage as a precondition for breath**, not the breath cycle itself. Four takeaways:

1. **Direct product-thesis validation.** The video's operative instruction is: *"Use visual feedback to confirm that you're actually doing what you intend to do."* That is Somatic's founding sentence, from a source the physician endorses. It also names the mechanism our product serves: the problem is "subconscious movements," not strength — exactly the interoception gap in `docs/mvp-plan.md`.
2. **The posterior expansion problem.** The video's central claim: the **back and upper rib cage are where expansion matters most**, and habitual "bunching" (upper sternum pulled back/down, lower ribs pushed forward/up) blocks it — people then **puff the chest and belly forward to compensate**. Two consequences for us:
   - **Capture-era:** a front-only camera literally cannot see the expansion this school cares most about. Posterior/multi-view capture moves from nice-to-have to a named requirement (logged in the roadmap backlog). OEP, the reference standard, always measured the full circumference.
   - **Framing:** large *anterior* motion can be compensation for a restricted back — which is precisely why our measured views say "brightness is motion, not a problem." Do not ever "upgrade" that copy to imply more motion = better; this video is the counterexample.
3. **Third Guide script — "Rib lengthening" (directions, not a breath). Implemented 2026-08-15 at the user's direction; her review pending.** The video teaches a specific coordination: upper sternum **forward and up**, lowest ribs **back and up** (never dropped, away from the pelvis), lower front ribs **narrowing** — lengthening the rib cage top to bottom (his elastic-band procedure). Shipped as script id `lengthen`: a slow 12 s ease-in → hold → release envelope (explicitly *not* reps), **no activation tints** (the video insists this is coordination, not muscular effort — all activations are zero), two new geometry drivers (`ribLift`: ribs rise away from the pelvis in the front figure; `sternumLift`: drives the side inset's sternum forward/up and lowest ribs back), slight negative `ribExpand` (lower front ribs narrow), and negative `spineFlex` (the side inset's spine lengthens toward straight — the C-curve's opposite). The side inset is now data-driven via a `sideCaption` field on the script. Since it imports a school's postural doctrine, **her review at the session decides whether it stays** — it is one enum entry and one script object to remove.
4. **A nuance to guard in the supported script:** her exhale has the ribs pulled "in, together, and down" — a *dynamic, phasic* action. The video warns against ribs held *habitually* bunched — a static set. These are compatible (contract through the exhale, release fully for the inhale), but the Guide must always show the supported exhale's rib depression **fully releasing** into the next inhale, never settling into a narrowed rest position. The current `ribExpand` curve already returns to rest; keep it that way.

### Her physiology model, captured as choreography

The clinical actions she cites, arranged into the loop the animation plays. **This table is the data model** — each row becomes an activation curve keyed to breath phase. It describes an **actively supported breath** (singing/trained support) and ships as the script named "Supported breath." A second script, "Quiet breath," ships alongside it (her decision, 2026-08-15) — its table follows below.

| Structure | Inhale | Exhale | Notes |
|---|---|---|---|
| Pelvic floor (levator ani) | **Engages first** (leads the cycle by ~5% of phase) | Releases | She has the breath *start* here |
| Diaphragm | Contracts, descends (red) | Relaxes, domes up (blue) | Existing dome morph (`flatten`) is the geometry half of this |
| Transversus abdominis | Tonic — **always maintains tone** | Tonic | Constant neutral-warm tint, never blue, never bright red |
| Rectus abdominis | Relaxes/yields (blue) | **Contracts** (red) | "While the diaphragm relaxes, the rectus contracts" |
| Internal/external obliques | Yield (blue) | Contract (red) | Exhale/support musculature |
| Intercostals | Active with rib expansion (red) | Fading through exhale | One layer tint; the internal/external split is a Track H refinement |
| Scalenes | Assist rib elevation (red, subtle) | Relax (blue) | Schematic neck hints, Guide view only |
| Traps (upper) | **Relax (blue)** to free the thoracic cavity | Neutral | Ties to the scapular-glide video; rhomboids are posterior — represented by the trap outline in front view |
| Platysma | Relaxes (blue, gentle) | Neutral | Shipped with the iMessage follow-up (neck roster complete) |
| Rib cage + whole figure | Expands (geometry, not just tint) | Settles | "The entire animation should oscillate" |

### Quiet breath choreography (second script)

Quiet tidal breathing at rest — standard respiratory physiology, the contrast case that makes the supported script legible. The defining differences: **exhale is passive** (elastic recoil — nothing "does" the exhale), the pelvic floor **yields downward** on inhale instead of engaging, and the abdominal wall stays quiet throughout.

| Structure | Inhale | Exhale | Notes |
|---|---|---|---|
| Pelvic floor (levator ani) | Yields / lengthens (blue, gentle) | Recoils to rest (neutral) | Descends with the abdominal contents — opposite of the supported script |
| Diaphragm | Contracts, descends (red) | Relaxes passively (fades to neutral, brief soft blue) | The only strong actor in the loop |
| Transversus abdominis | Low resting tone (faint warm, ~+0.1) | Same | Quieter than the supported script's tone |
| Rectus abdominis | Quiet (neutral) | Quiet (neutral) | No abdominal effort at rest |
| Internal/external obliques | Quiet (neutral) | Quiet (neutral) | — |
| Intercostals | External set mildly active (soft red) | Fade to neutral | Smaller amplitude than supported |
| Scalenes | Barely active (near-neutral) | Neutral | Accessory muscles stay out of a quiet breath |
| Traps (upper) | Neutral | Neutral | Nothing to release — they were never working |
| Rib cage + whole figure | Gentle expansion (~60% of supported amplitude) | Settles by recoil | Slower, smaller oscillation |

Geometry drivers for `quiet`: `diaphragmFlatten` peaks lower (~0.7 vs 1.0), `ribExpand` peaks at ~0.6, `pelvicLift` is **inverted relative to supported** — it goes slightly *negative-direction* (implemented as lift 0 → the dome rendered a couple of viewBox units *lower* at peak inhale; give `pelvicLift` range [-1, 1] where negative means descended below rest, positive means lifted above rest, 0 = rest). Cycle a touch slower: `cycleMs: 6000`, `inhaleFraction: 0.42` (near-even in/out with passive tail).

---

## Implementation spec

### Decisions locked (do not relitigate during implementation)

1. **Guide is a third stage view:** the toggle becomes `Regions | Field | Guide`. Same figure, same depth rail. The Guide runs on an internal phase clock, **not** the sample stream — the mock source keeps running (traces/metrics stay live) but the torso ignores it while in Guide.
2. **Separation from "your data" is done with wording + legend, not a separate page.** Caption and legend text below are approved copy.
3. **Two scripts ship, selectable in the Guide view** (her decision, 2026-08-15): id `quiet`, label "Quiet breath," and id `supported`, label "Supported breath" (her memo's choreography). Scripts are plain data objects; the renderer must not special-case either one. **Default: `supported`** (her requested animation and the singing use case) — the therapist can flip the default in review. Selection persists in localStorage (`somatic.guideScript.v1`).
4. **Pelvic floor joins the `deep` layer** (diaphragm & deep) rather than becoming a 7th depth stop. Teaching-wise the pairing is right — the "two domes" of the core — and it avoids churning `AnatomyDepth`, the rail, and stored-depth migration. Update the `deep` label to "Diaphragm & core" and `public/anatomy/README.md` accordingly. Revisit as a separate stop only if she asks.
5. **Red/blue exists only in Guide view.** `src/lib/color.ts` gains an `activationColor()`; no existing gold ramp changes.
6. **Zero new dependencies.** Everything is React state + SVG + the existing CSS.

### Agent orientation (read before coding)

- Stack: React + TypeScript + Vite, zero runtime deps beyond React. `npm run build` must pass after each phase; check wide and ~420 px layouts in `npm run dev`. GitHub Pages base is `/somatic/` — use `import.meta.env.BASE_URL` for any asset URL. Commit per phase, one-line messages matching `git log` style; push when all phases build clean.
- Key files and current facts (verified 2026-08-15):
  - `src/components/TorsoMap.tsx` — the figure. ViewBox `0 0 240 250`, clip `#torso-clip`. Holds `view` state (`MapView`), `depth` state, `reduceMotion` matchMedia state, the `v` and `[`/`]` key handler (guarded against `TEXTAREA|INPUT|SELECT` targets). Whole-figure breathing scale exists: the `g.torso-breathe` group scales by `1 + min(total, 22) * 0.0012` around origin `120px 96px`. The diaphragm morph is the `flatten` prop (0–1) into `AnatomyStack`, currently `min(1, meanAbdomen/9.5)`, zeroed when `reduceMotion || depth > 2`.
  - `src/field/view.ts` — `MapView = "regions" | "field"`, storage key `somatic.mapView.v1`, `loadStoredView()` validates the raw string. `src/field/ViewToggle.tsx` renders the two buttons.
  - `src/anatomy/layers.ts` — 6-layer manifest, `AnatomyDepth = 1..6`, `layerOpacity()`, storage key `somatic.anatomyDepth.v2`, image-or-placeholder swap via `layerHref`.
  - `src/anatomy/placeholders.tsx` — all schematic art. Structures already drawn as class-named paths: `anatomy-diaphragm`, `anatomy-psoas`, `anatomy-transversus` (3 arcs), `anatomy-rectus` (6 segment blocks), `anatomy-oblique` (+ `anatomy-oblique-fiber`), `anatomy-intercostal` (hatch group), `anatomy-pec` (4 paths), ribs via `ribPair(attachY, halfWidth, lateralY)` over the `RIBS` table, `diaphragmPath(flatten)` / `diaphragmRim(flatten)` exported. **No pelvic floor, traps, or scalenes exist yet.**
  - `src/anatomy/AnatomyStack.tsx` — maps the manifest to `<g class="anatomy-layer anatomy-layer-{id}">` with opacity from `layerOpacity`; threads `flatten` into placeholders; PNG replaces placeholder when it loads.
  - `src/App.tsx` — keyboard handler owns space/arrow keys; TorsoMap's handler owns `v`, `[`, `]`. **Taken keys: space, ArrowLeft/Right, `[`, `]`, `v`. Use `g` for Guide.**
  - `src/index.css` — all styling; `.anatomy-*` classes set stroke/fill of placeholder art; a `prefers-reduced-motion` block exists.
- Language guardrails: education not assessment. Allowed words: "contracting", "relaxing", "tone", "reference animation". Forbidden: "correct/incorrect", "should", "weak", "tight", "dysfunction", "heat".
- The tint must never leak into Regions/Field views, and the gold motion visuals must never render in Guide view.

### Data model (B1)

New directory `src/guide/`:

```ts
// src/guide/script.ts
export type GuideStructureId =
  | "pelvic_floor" | "diaphragm" | "transversus" | "rectus"
  | "obliques" | "intercostals" | "scalenes" | "traps";

/**
 * Activation at a phase point. Range [-1, 1]:
 *   +1 fully contracting (red), -1 fully relaxing/lengthening (blue),
 *   0 neutral. Tonic structures hover at a small positive constant.
 */
export type ActivationFn = (phase: number) => number; // phase in [0, 1)

export type GuideScriptId = "quiet" | "supported";

export type GuideScript = {
  id: GuideScriptId;
  label: string;              // "Quiet breath" / "Supported breath"
  blurb: string;              // one sentence under the selector, education-not-assessment wording
  cycleMs: number;            // supported: 5000; quiet: 6000
  inhaleFraction: number;     // supported: 0.4; quiet: 0.42
  activations: Record<GuideStructureId, ActivationFn>;
  /** Geometry drivers, phase → number */
  diaphragmFlatten: (phase: number) => number; // 0..1, feeds existing `flatten`
  ribExpand: (phase: number) => number;        // 0..1, feeds skeleton/figure oscillation
  pelvicLift: (phase: number) => number;       // -1..1: negative = descended below rest,
                                               // positive = lifted/engaged, 0 = rest
};

export const GUIDE_SCRIPTS: GuideScript[]; // [quiet, supported] — both per the tables above
export const DEFAULT_GUIDE_SCRIPT: GuideScriptId = "supported";
export const GUIDE_SCRIPT_KEY = "somatic.guideScript.v1";
// loadStoredScript() / saveStoredScript() following the pattern in src/field/view.ts
```

Implementation notes:

- Build activations from one shared easing helper (half-cosine ramps), not per-structure ad-hoc math, so curves stay smooth across both scripts. **Both scripts are built in B1**, encoding their tables above. Supported: pelvic floor leads by ~5% of phase; transversus is a constant ~+0.25; rectus/obliques go negative during inhale and ramp positive through exhale; diaphragm positive during inhale, negative during exhale; intercostals positive during inhale fading through exhale; scalenes small positive late-inhale; traps negative during inhale, ~0 during exhale. Quiet: per its table — diaphragm is the only strong actor, pelvic floor yields (gentle negative activation, negative `pelvicLift`), abdominal wall near-zero, everything recoils passively to neutral on exhale.
- Also export `guidePhase(nowMs, script): number` — pure, testable: `(nowMs % cycleMs) / cycleMs`.
- The clock lives in a small hook `src/guide/useGuideClock.ts`: `requestAnimationFrame` loop that yields `phase`, paused (returns a fixed phase) when `reduceMotion` — see B4.

*Accept B1:* both scripts compile as data objects with unit-testable pure functions; spot-check a few phase points against the tables (e.g. supported at phase 0.2: diaphragm > 0, rectus < 0; quiet at phase 0.2: rectus ≈ 0, pelvicLift < 0); no UI change; build clean. Commit.

### Rendering (B2) — activation tint on the placeholder anatomy

1. **Color:** add to `src/lib/color.ts`:

```ts
/** Red for contracting (+), blue for relaxing (−), transparent near 0. */
export function activationColor(a: number): string {
  const t = Math.min(1, Math.abs(a));
  const eased = t * t * (3 - 2 * t);
  return a >= 0
    ? `hsla(4, 68%, ${40 + eased * 14}%, ${eased * 0.55})`   // muted red
    : `hsla(210, 60%, ${46 + eased * 12}%, ${eased * 0.5})`; // muted blue
}
```

   Tune lightness/alpha in place; keep both hues desaturated enough that the anatomy line art stays legible under the tint (same principle as the gold treatment: G3's lesson was that full-strength color buries the drawing).

2. **Threading:** `AnatomyStack` and `AnatomyPlaceholder` gain an optional `activations?: Record<GuideStructureId, number>` prop (current numeric values, already sampled from the script by the caller — placeholders stay dumb). When present, each structure's paths get an overlaid tint: for filled shapes (rectus, obliques, diaphragm, pec/traps) render a duplicate path filled with `activationColor(a)` on top of the line art; for stroke-only structures (transversus arcs, intercostal hatches, scalenes) apply the color to `stroke` with widened `strokeWidth`. Keep the mapping structure→class-names in one exported table in `placeholders.tsx` so Track H tint overlays can reuse it.
3. **New placeholder art** (schematic, dim line art like everything else in that file):
   - `pelvic_floor` inside `DeepLayer`: a shallow upward-curving dome spanning the pelvic bowl (x ≈ 102–138, y ≈ 208–218), drawn with `pelvicLift` moving it up/down by ~3 viewBox units — mirror of `diaphragmPath`'s parameterization. Class `anatomy-pelvic-floor`.
   - `traps` in `SuperficialLayer`: two small triangles at the neck-shoulder line (from neck base ≈ (108, 62)/(132, 62) out toward the shoulder), class `anatomy-trap`.
   - `scalenes`: 2–3 short lines per side on the neck (the `NECK` path region, y ≈ 40–64) — note the neck sits **outside** `#torso-clip`, so render these in a separate unclipped group that only mounts in Guide view. Class `anatomy-scalene`.
   - Update the `deep` layer label to "Diaphragm & core" in `layers.ts`, and `public/anatomy/README.md` (deep.png now includes the pelvic floor; Track H list unchanged otherwise).
4. **Legend** component `src/guide/GuideLegend.tsx`: one line, always visible in Guide view, under the figure next to the caption: red swatch "contracting" · blue swatch "relaxing" · the text **"Reference animation — not your data."** That exact sentence is the approved copy.

*Accept B2:* with a hardcoded test activation record, tints render on the correct structures at every depth 1–6 and never appear in Regions/Field; line art stays legible under full tint; build clean. Commit.

### Guide view integration (B3) — the oscillating figure

1. **View plumbing:** `MapView` becomes `"regions" | "field" | "guide"`; bump storage key to `somatic.mapView.v2` (validate the stored string against the union; old key can be ignored — default `regions`). `ViewToggle` gains a third button "Guide". Keyboard: `g` toggles Guide ↔ previous view, `v` continues to toggle Regions ↔ Field (from Guide, `v` goes to Regions); extend the existing handler in `TorsoMap.tsx`, same input-target guard.
2. **Script selector:** in Guide view only, a two-pill toggle (`Quiet breath | Supported breath`) styled like `ViewToggle`, placed with the legend under the figure; `aria-pressed` on the pills; selection persists via `GUIDE_SCRIPT_KEY`; switching scripts keeps the clock running (phase carries over — no jarring restart). Show the selected script's one-line `blurb` beside it. Approved blurbs: quiet — "Breathing at rest. The diaphragm works; the exhale is elastic recoil."; supported — "An actively supported breath, as used in singing. Support musculature works through the exhale."
3. **In Guide view, per frame** (phase from `useGuideClock`, using the selected script's `cycleMs`):
   - Sample every `ActivationFn` once into a record; pass to `AnatomyStack`.
   - `flatten` = `script.diaphragmFlatten(phase)` (replaces the sample-driven value; the `depth > 2` zeroing no longer applies in Guide — the dome should move at *every* depth since it's the star of the show, but keep the existing behavior in the other views).
   - **Whole-figure oscillation:** drive the existing `torso-breathe` scale from `ribExpand` (same magnitude budget as today: scale 1 → ~1.02) and pass `ribExpand` into the skeleton placeholder: `ribPair` half-widths multiply by `1 + expand * 0.05` and lateral y-anchors shift up by `expand * 2` viewBox units, so the ribs visibly widen and rise. Thread as an optional `expand?: number` prop alongside `flatten`.
   - Gold visuals (compartment glow/wash, blob field, relief) do **not** render. Bone lines, midline, landmarks, hover hit-paths stay; hover mm readouts still work (they read the live sample — that's fine, they're labeled as measurements).
   - Caption (the existing `torso-caption` slot): **"Guide · {script label} — a reference loop of the coordinated breath. G returns to your data."** plus the legend component.
4. **Depth rail** works unchanged; verify both scripts read at each depth (e.g. at depth 5, supported shows traps relaxing while quiet shows them neutral; at depth 2 the two domes work — pelvic floor lifting in supported, yielding downward in quiet; at depth 4, supported shows rectus/obliques trading with the diaphragm while quiet stays still).
5. Traces/metrics/record buttons keep running on the live sample stream — do not pause the source. Recording while in Guide view is allowed (it records the mock stream as always); no special casing.

*Accept B3:* both scripts play (supported ~5 s/cycle, quiet ~6 s); the selector switches between them without a phase jump and persists across reload; in supported, the pelvic floor visibly leads and diaphragm/rectus alternate; in quiet, the diaphragm works alone, the pelvic floor descends, and the abdominal wall stays still; ribs and silhouette oscillate (visibly gentler in quiet); toggling to Regions/Field instantly restores the gold measured views; `g`/`v` keys work and don't fire in inputs; both breakpoints; build clean. Commit.

### Reduced motion + polish (B4)

1. Under `prefers-reduced-motion` the clock freezes at phase 0.2 (mid-inhale) and a **phase slider** appears next to the legend (range 0–1, step 0.01, labeled "Breath phase") so the loop can be scrubbed manually. The slider is also available via a small "pause" toggle for everyone (teaching benefit: the therapist can hold a phase and talk).
2. `aria-live` is NOT used for the guide (it's decorative motion); the legend and caption are plain text. The Guide button gets `aria-pressed` like its siblings.
3. Final pass: check tint alphas over every depth, confirm no gold/red-blue crossover in any view, run the full preset list in Regions/Field to confirm zero regression, `npm run build`, commit, push.

*Accept B4:* reduced-motion shows a static, scrubable frame; pause+scrub works for everyone; no regressions in the measured views; build clean, pushed.

## Physician follow-up (iMessage, 2026-08-15 — after implementation)

Full messages preserved at `context/transcripts/2026-08-15-physician-imessage-follow-up.txt`. Four points, all acted on:

1. **"Include neck & shoulder muscles."** Confirms the neck scope (open question 2). Scalenes and upper traps already shipped; the sternocleidomastoid and the platysma (a fan of superficial sheet lines over the clavicles, relaxing on the supported inhale per her memo) were added in response. The neck roster from her memo is now complete.
2. **Exhale mechanics of active abdominal breathing:** the slight rectus contraction on exhalation forms a slight C-curve of the spine; the ribs are pulled **in, together, and down** while the superior thoracic cavity stays relaxed so the next breath can fill fully. Implemented: the supported script's `ribExpand` now dips below rest through the active exhale (ribs visibly narrow and descend) before settling. The **C-curve is sagittal-plane motion — invisible in a front view** — so a schematic **side inset** (`src/guide/SideInset.tsx`) renders it in the supported script: the spine flexes forward mid-exhale while the belly swells with the descending diaphragm.
3. **"The red/blue should be a transparency gradient where the solid color is full contraction/relaxation."** Implemented: `activationColor()` alpha now runs 0 (neutral) → 1 (full), replacing the earlier ~0.55 cap.
4. **Product confirmation:** "the visualization is first step of the application"; after the basic breath is mapped, **motion recording comes later — possibly a combination of EMG, acupuncture-needle mapping, and motion tracking** (all later versions). This validates the modeled-vs-measured mode split and is logged in the roadmap backlog.

## Open questions for the physician

1. ~~**Which breath is this?**~~ **Answered 2026-08-15: both.** Her choreography — pelvic floor *contracting* to start the inhale, rectus contracting on exhale — describes an actively supported breath (singing/trained support); quiet tidal breathing (pelvic floor yields on inhale, passive exhale) is the contrast case. Both ship as selectable scripts; see the two choreography tables and the script selector in B3. Her review of the quiet-breath table happens at the review session.
2. ~~**Scope of the neck**~~ **Answered 2026-08-15 (follow-up above): include neck & shoulder muscles.** Scalenes, SCM, upper traps, and platysma all ship; extend the figure crop only if she asks.
3. ~~**Confirm the color scope**~~ **Effectively confirmed** by the follow-up: she engaged with red/blue as the Guide encoding ("transparency gradient…") and confirmed the visualization-first framing. Measured views stay gold.
4. **(From the rib-geometry video)** The "Rib lengthening" directions now ship as a third Guide script (implemented at the user's direction — see the fourth-video assessment). **Her review decides whether it stays**, since it renders one school's postural doctrine; removal is trivial if she declines.

## Guardrails carried forward

- Education, not assessment: "contracting/relaxing," never "weak/tight/dysfunctional."
- The legend sentence ("Reference animation — not your data.") is mandatory and always visible in Guide view.
- Zero new dependencies; the choreography is math + the existing SVG machinery.
- Track H note: realistic renders will need per-structure tint overlay shapes (the vector tint paths from B2 double as these); the structure→shape table in `placeholders.tsx` is the contract.
