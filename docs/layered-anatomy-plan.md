# Layered Anatomy Visualization — Implementation Plan

**Date:** 2026-08-15
**Status:** Ready for handoff. An implementing agent should start at "Handoff: division of labor" and execute the G-phases in order.
**Reference material:** `docs/reference/anatomy-layers/` (14 screenshots from a commercial 3D anatomy app showing a progressive muscle "peel" from superficial pecs/obliques down to intercostals, diaphragm, psoas, and bare skeleton, plus the layer-toggle rail UI)

## Goal

Replace the current stylized SVG torso with an anatomically realistic, *layered* figure — like the reference screenshots — while keeping everything that already works: the six-compartment motion heatmap, landmarks, hover readouts, record/replay, and the mock data contract. The user should be able to peel from skin-level musculature down to the skeleton and diaphragm, with the breath heatmap readable at every depth.

## Non-goals

- Not a general anatomy atlas. We need the **respiratory-relevant subset only**: skeleton (rib cage, spine, pelvis), diaphragm, deep abdominal wall, intercostals, superficial trunk muscles. No arteries/veins/nervous/digestive/urogenital/lymphatic systems from the reference rail.
- Not real-time 3D orbit/zoom. Fixed front view (the camera view our future capture rig will have).
- No per-muscle activation claims. Layers are *context for teaching* ("this is what's under the region that isn't moving"); displacement remains the only measured/mocked quantity. Guardrails from `docs/improvement-plan.md` still apply — no assessment language.

## The one design rule that governs everything

**Anatomy is context; motion is signal.** The reference app's renders are beautiful but visually loud — every muscle is saturated red. If we composite our gold heatmap onto that, nothing reads. So: all anatomy layers get desaturated and darkened toward the app's palette (muted umber/bone on near-black), and the motion heatmap remains the *only* saturated, bright thing on screen. If a screenshot of the finished feature draws your eye to a muscle instead of the breath, the art direction is wrong.

---

## Approach decision

Three options were considered:

**A. Hand-drawn layered SVG.** Keep everything vector. Feasible but the realism ceiling is low and the art time is enormous — realistic intercostals and a diaphragm dome in hand-written path data is weeks of fiddly work, and it will still look like clip art next to the reference.

**B. Pre-rendered raster layers from an open 3D anatomy model (RECOMMENDED).** Render each anatomical depth once, offline, from an openly licensed 3D model in Blender: fixed orthographic front camera, one transparent PNG per layer, identical framing. The app composites these PNGs as a stack and crossfades between depths. Realism comes free from the source model; the app stays dependency-free (images are just `<image>` elements in the existing SVG); file weight is bounded (5–7 PNGs, ~100–300 KB each after optimization).

**C. Real-time 3D (three.js + glTF).** Closest to the reference app, but adds a large dependency (violates the no-deps guardrail), a rendering/perf burden, mobile risk, and buys nothing our fixed-view product needs. Rejected for now; the raster pipeline leaves this door open later (same source model).

**Decision: Option B**, with Option A's current vector figure kept as the loading/fallback state.

### Asset sourcing and licensing (gates Track H only, not the app work)

The reference screenshots are from a commercial app (Elsevier/3D4Medical-style). **We cannot copy, trace, or re-render their imagery.** Openly licensed sources to render from:

1. **Z-Anatomy** (Blender project, CC-BY-SA) — modern, complete, already organized in layers/collections. First choice.
2. **BodyParts3D** (CC-BY-SA 2.1 JP) — per-structure meshes, older but very complete; good fallback for individual structures (diaphragm).

Both are share-alike: derived renders must be attributed and shared under the same license. Action items: add an "Anatomy imagery" attribution line to the app footer and a `CREDITS.md` in the repo; confirm CC-BY-SA imagery inside an MIT-ish prototype repo is acceptable (it is — the license attaches to the images, not the code; keep renders in a clearly-marked folder with their own LICENSE note).

---

## Layer model

Five anatomy layers, deep → superficial, matching the teaching story ("what's underneath the breath"):

| # | Layer id | Contents | Teaching purpose |
|---|----------|----------|-----------------|
| 1 | `skeleton` | Rib cage, sternum, clavicles, spine, pelvis | Where ribs actually are; costal margin is real, not schematic |
| 2 | `deep` | Diaphragm (dome, crura), psoas, transversus abdominis | *The* breathing muscle nobody can see; the "breathe into your back" layer |
| 3 | `intercostal` | Internal/external intercostals, deep rib cage wall | Rib-to-rib motion; what "ribs widening" physically is |
| 4 | `ab_wall` | Rectus abdominis, internal/external obliques | The "support" musculature — central to singing and exhale control |
| 5 | `superficial` | Pec major, deltoid, serratus | The palpable layer; what a hand on the client touches |
| 6 | `surface` | Skin-tone-neutral body silhouette (subtle) | Softens the figure; optional, lowest priority |

*(Updated 2026-08-15 after reviewing the reference video (`docs/reference/anatomy-layers/vid-*.png`): the app's trunk peel treats the abdominal wall as its own stratum, and it earns the slot — rectus/obliques are the singing-support muscles. Six layers, still muscle strata only, no extra systems.)*

On top of the anatomy stack, always-on overlay layers (existing functionality, unchanged in role):

- **Heatmap compartments** — the six regions, now rendered as translucent tinted glows over the anatomy instead of opaque fills
- **Landmarks** ("points of interest") and midline
- **Invisible hit-paths** for hover → mm readout (the current compartment paths, made transparent, kept for interaction)

### Depth interaction (mirrors the reference app's Muscle+/Muscle− buttons)

A single **depth stepper** (or 5-stop slider) in the stage: each step peels one layer. Depth 5 = full superficial view; depth 1 = skeleton + diaphragm. Crossfade layers with opacity over ~200 ms. Persist chosen depth in localStorage. Keyboard `[` / `]` steps depth. `prefers-reduced-motion`: cut without animating. Default depth on first load: **2 (deep — diaphragm visible)**, because the diaphragm is the product's best teaching image and it's the view no other tool gives a yoga client.

---

## Asset production pipeline (offline, one-time, repeatable)

1. **Set up the source scene.** Import Z-Anatomy in Blender. Isolate collections per layer table above; delete head detail below the eyes if it distracts (reference keeps the skull — fine either way), arms below mid-forearm, legs below mid-thigh, matching the app's current crop.
2. **Fix the camera once.** Orthographic, true front, framed so sternal notch / xiphoid / umbilicus land at known fractions of the image height. Write these numbers into a `calibration` note (see Integration). Never move the camera again — every layer renders from this exact camera so the stack registers pixel-perfectly.
3. **Style pass.** Matte materials only. Desaturate: muscle to muted umber (≈ our `--gold`/brown family), bone to warm off-white ivory, tendon/aponeurosis to pale parchment. Single soft key light, no speculars, near-black background, render with alpha.
4. **Render each layer to PNG** at 2× display size (~1200×1600), transparent background. Layers render *cumulatively from the back*: e.g. the `intercostal` render includes skeleton behind it, OR render each in isolation and let the app stack them — **choose isolation** (each layer alone with alpha) so the app controls compositing and opacity per layer independently.
5. **Optimize**: `oxipng`/`pngquant` to keep each layer ≲ 300 KB. Total budget ≤ 1.5 MB.
6. **Commit** renders to `public/anatomy/` with the source `.blend` settings documented in `docs/reference/anatomy-layers/PIPELINE.md` so re-renders are reproducible.
7. **Fallback asset**: none needed — the existing vector torso stays in the code and shows until images load (and forever if assets fail).

Estimated effort: 1–2 days for someone comfortable in Blender; the styling pass is most of it. This is human work (Track H below) — it does **not** block the in-app layer architecture, which ships first with schematic placeholders.

## Integration into the existing scaffolding

All changes concentrate in `TorsoMap.tsx` plus a small amount of app state; the data contract, traces, Konno–Mead, metrics, and record/replay are untouched.

1. **Layer stack.** Inside the existing SVG (same `viewBox`), render the anatomy PNGs as stacked `<image>` elements, deep-first. Opacity per layer driven by the depth state. The existing vector `TORSO`/arm paths become the loading fallback, swapped out when images finish loading (preload all five up front).
2. **Calibration.** A single constants object maps the render's anchor pixels (sternal notch, xiphoid, umbilicus, left/right costal margins in image coordinates) to viewBox coordinates. The compartment `PATHS` and `LANDMARKS` get re-traced **once** against the skeleton render so regions sit on the actual rib cage — this is a coordinate edit, not an architecture change. Document the anchor table in the code comment; the future camera rig will use the same anchors.
3. **Heatmap re-treatment.** Compartment fills change from opaque paint to a glow treatment that reads over photographic detail: translucent gold fill (opacity scaled by displacement) plus a soft blurred stroke (SVG `feGaussianBlur` filter — still zero dependencies). Brightness stays the only encoding; test legibility at every depth, especially over the busy intercostal layer. If a layer fights the heatmap, darken that layer's render, not the heatmap.
4. **Depth control UI.** Vertical mini-rail on the stage edge (visual nod to the reference app's rail): five small buttons or a stepper, labels on hover ("Skeleton", "Diaphragm & deep", "Rib wall", "Surface muscle", "Body"). Active depth highlighted. Sits with the existing phase pill; collapses to a horizontal row on narrow screens.
5. **Hover/interaction.** Keep the current invisible compartment paths above the images for mouse events and the mm caption. Landmarks stay on top, still toggleable.
6. **Diaphragm animation (stretch goal, separate commit).** The `deep` layer's diaphragm can be a *second* small render pair (dome-high / dome-low) crossfaded by breath phase, or a vector dome path morphed by `meanAbdomen` — flattening on inhale. This is the single most valuable animated element in the whole product (it shows the invisible muscle moving with *your* mock breath) but it must not block the static layer work. Respect `prefers-reduced-motion`.
7. **Cross-section panel** stays as is for now; a future version could get a matching realistic transverse render, but it's out of scope here.

---

## Handoff: division of labor

The Blender asset pipeline **cannot be done by a coding agent** — it needs a human (or a later, separately supervised headless-Blender effort). To avoid blocking, the work splits into two independent tracks:

- **Track G (agent, do now):** build the complete layer architecture, depth stepper, glow heatmap, and an animated diaphragm — using **schematic vector placeholder layers the agent draws itself**. All layer imagery loads through a manifest, so when real renders exist they drop in with zero code changes.
- **Track H (human, later):** the Blender pipeline above (phases H0/H1). Output: five PNGs + calibration anchor table committed to `public/anatomy/`, filenames matching the manifest.

The agent must NOT attempt to produce "realistic" raster imagery itself — no generated images, no base64 blobs, no downloading anatomy imagery from the web. Schematic vector placeholders only. They should look like clean medical-diagram line art (ribs as arcs, diaphragm as a dome, muscle groups as subtle hatched regions), clearly better than nothing but obviously schematic.

### Agent orientation (read before coding)

- Stack: React + TypeScript + Vite, zero runtime deps beyond React. Keep it that way.
- Key files: `src/components/TorsoMap.tsx` (the figure — nearly all work lands here), `src/types.ts` (landmarks, compartment ids), `src/lib/color.ts` (heatmap colors), `src/App.tsx` (state, keyboard shortcuts — note existing `space`/arrow-key handlers; don't collide), `src/index.css` (all styling, dark theme, `prefers-reduced-motion` block exists).
- The SVG `viewBox`, six compartment `PATHS`, `TORSO` silhouette, clip path, landmarks, and hover-mm behavior all exist in `TorsoMap.tsx`. Do not regress them.
- Verify with `npm run build` after each phase; run `npm run dev` and check both wide and narrow (~420 px) layouts. Deploy is GitHub Pages under base `/somatic/` — asset URLs must respect `import.meta.env.BASE_URL`.
- Commit per phase with a one-line message, matching the existing history style. Push when all phases build clean.
- Existing product guardrails (from `docs/improvement-plan.md`): education-not-assessment language everywhere; no new dependencies; keyboard shortcuts must not fire while typing in inputs.

## Phasing, acceptance criteria, estimates

### Track G — agent, now

**Phase G1 — Layer architecture + manifest + schematic placeholder layers.**
Define the five-layer model in code (ids per the table above). Create a layer manifest (a typed constants module) where each layer is either a vector placeholder component or an image URL under `public/anatomy/`; at runtime, if the image exists/loads, it replaces the placeholder — this is the swap point for Track H, zero code changes later. Draw the five schematic placeholders as SVG groups within the existing viewBox, registered to the current torso geometry: skeleton (rib arcs, sternum, clavicles, spine hint, pelvis hint), deep (diaphragm dome under the costal arch + psoas hints), intercostal (short hatching between rib arcs), superficial (subtle muscle-group outlines: rectus segments, obliques, pecs), surface (the existing silhouette, dimmed). Desaturated, dim, line-art style — the heatmap must remain the brightest thing.
*Accept:* all five layers render and stack correctly; existing heatmap/hover/landmarks unaffected; build clean.

**Phase G2 — Depth stepper UI.**
Depth state 1–5, vertical mini-rail beside the figure (horizontal row on narrow screens), hover labels, active highlight, `[`/`]` keyboard (guarded against inputs, no collision with existing shortcuts), localStorage persistence, ~200 ms opacity crossfade, instant cut under `prefers-reduced-motion`. Default depth 2 (diaphragm visible).
*Accept:* peeling works at both breakpoints; depth persists across reload; keyboard works; reduced-motion honored.

**Phase G3 — Heatmap glow treatment.**
Replace opaque compartment fills with translucent gold fill + soft blurred stroke (SVG filter, no deps), opacity scaled by displacement. Tune so all seven presets stay distinguishable at a glance at depths 1, 2, and 4; "left quiet" visibly quiet.
*Accept:* the preset-distinguishability check passes at every depth; hover mm readout still works.

**Phase G4 — Animated diaphragm (vector morph).**
At depths 1–2, the placeholder diaphragm dome morphs with the live sample: dome flattens/descends as mean abdominal displacement rises, returns on exhale. Subtle — a few viewBox units. Disabled under reduced motion. This works with placeholder art and must not wait for renders.
*Accept:* dome motion visibly syncs with the abdomen trace across presets; off under reduced motion.

### Track H — human, later (gates nothing in Track G)

**Phase H0 — Licensing + pipeline spike (½–1 day).**
Download Z-Anatomy, confirm license posture, produce ONE test render (skeleton layer) at the target framing/style. *Accept:* a skeleton PNG that drops into the manifest slot and registers plausibly with the compartments.

**Phase H1 — Full render set (1–2 days, mostly Blender).**
All five layers rendered, styled, optimized, committed to `public/anatomy/` with pipeline doc + credits + calibration anchor table. *Accept:* stack composites correctly at 1× and 2×; total weight ≤ 1.5 MB; consistent style.

**Phase H2 — Re-trace follow-up (agent, after H1).**
Re-trace compartment `PATHS` and `LANDMARKS` onto the real skeleton render using the calibration anchors; re-tune glow legibility over the real imagery. *Accept:* same preset-distinguishability gate over real anatomy.

## Risks and mitigations

- **Blender skills/time** — the render pipeline is the long pole, which is why it's decoupled: Track G ships a complete, useful layered UI on schematic art regardless of when (or whether) Track H happens.
- **Legibility regression** — realistic texture can bury the signal. Mitigation: the design rule up top; test with the "can you tell presets apart in seconds" gate before shipping; keep a "Simple" depth (current vector look) if needed.
- **Share-alike license contamination worries** — keep CC-BY-SA renders in a dedicated folder with their own LICENSE/credits; app code license unaffected.
- **Asset weight on Pages** — budget enforced in H1; lazy-load layers 3–5 if first paint suffers.
- **Registration drift** — one camera, one calibration table, anchors documented; re-traces happen against the skeleton render only.

## What NOT to do

- Do not trace or sample pixels from the reference screenshots — they are licensing reference for *layout and interaction*, not source art.
- Do not add three.js/model-viewer in this pass.
- Do not add the non-respiratory system layers from the reference rail.
- Do not let any layer name or caption drift into assessment language ("weak", "tight", "dysfunctional"). Layer labels are anatomical nouns only.
