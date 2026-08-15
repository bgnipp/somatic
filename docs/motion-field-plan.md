# Motion Field ("Heat Signature") — Plan

**Date:** 2026-08-15 (revised same day: relief shading promoted from non-goal to target — see "Why relief")
**Status:** Ready for handoff. Implementing agent: start at "Handoff notes", execute F1 then F2.
**Reference:** `docs/reference/motion-field/field-ref-*.png` — frames from a Schrödinger-equation animation the physician shared: a continuous field rendered as smooth animated peaks, intensity rising where amplitude is high.

## The idea, translated to our product

Today the torso heatmap is six compartment tiles that brighten with motion. The reference suggests replacing (or complementing) that with a **continuous motion field**: a smooth intensity surface over the torso that blooms organically where the body is moving, with no visible tile seams — the way a thermal camera image *looks*, but driven by displacement, not temperature.

## Why relief (the 3D reading) belongs in this product

The reference's peaks are not just style for us. Our measured quantity **is height**: anterior displacement, the chest wall physically rising toward the viewer, in millimeters. A relief surface where the belly visibly *bulges* during an abdominal breath — swelling and settling in sync with the anatomy layers and the diaphragm morph underneath — renders the actual physical event, exaggerated for visibility. That makes the lit, bumpy look *more* honest than flat color, not less. The vision this plan targets: the layered anatomy figure as the ground, with a softly lit motion-relief surface breathing on top of it, both animating together from the same sample stream.

What stays out is the *true 3D scene* — orbiting camera, tilted dish, mesh geometry. A fixed front view with lit relief (2.5D) gets ~90% of the perceived depth at zero dependencies; a real 3D engine buys the remaining 10% at the cost of a large dependency and a rebuild of the anatomy layer system. Revisit true 3D only in the camera era, if dense capture justifies it.

## Does it make sense? Yes, with three caveats that shape the whole design.

**1. Honesty: we have six numbers, not a field.** Mock (and any near-term capture) samples six sites. A smooth field over the whole torso is an *interpolation* — pixels between sites are invented. That's acceptable for a teaching mirror if we say so: the landmark dots stay visible as the true sample sites, and the caption reads "field interpolated from 6 regions." When real capture arrives with denser markers, the same renderer just takes more sites — this feature is actually a good architectural bridge to dense capture.

**2. Naming: not "heat."** We measure motion. Calling it a heat signature invites two misreadings: that we sense temperature (medical thermography is a regulated diagnostic domain we must not gesture at), and that hot = bad. In-product name: **motion field**. Same guardrail language as today: brighter is more motion, not a problem.

**3. Color: keep one channel.** The reference's cyan/magenta/yellow rainbow is the wrong lesson — multi-hue reads as categories ("red = danger"). The field stays our single gold ramp: transparent at rest, brighter with motion. No thermal palette.

The genuinely valuable part of the reference is the **continuity and the animation**: seams disappear, motion looks alive, asymmetry (left dim, right bright) reads as one organic picture instead of a bar chart painted on a body.

## What NOT to take from the reference

- The true-3D scene: orbiting/tilted camera, mesh geometry, a rendering engine. Relief comes as a *lit height field* in the fixed front view (see Approach C), not as 3D.
- The rainbow palette (above).
- WebGL — unnecessary for six-to-dozens of sites; canvas shading is enough.

## Design

### Data contract

A small, source-agnostic addition — no change to `Sample`:

- `FieldSite = { x, y, mm }` in torso viewBox coordinates.
- A pure function derives sites from a `Sample`: today, the six compartment centroids (plus the two lateral points when present). Later, camera markers map to sites 1:1. The renderer never knows where sites came from.

### Rendering — three stages, each building on the last

**Approach A (scaffolding): SVG radial-gradient blobs.**
One radial gradient per site, radius proportional to region size, opacity driven by that site's mm through the existing tone ramp, all blobs in a group blended with `lighter`/`screen` and softened with the existing blur filter, clipped to the torso. Overlapping blobs merge into one continuous field. Zero dependencies, ~30 lines of markup, cheap at 30 Hz. This validates the sites/toggle/compositing plumbing and may already be usable, but it is flat — a stepping stone, not the destination.

**Approach B: canvas IDW height field.**
Offscreen `<canvas>` at low resolution (~120×130), per-pixel inverse-distance-weighted interpolation of the sites each frame. This *is* the height field: each pixel's value is interpolated millimeters. Rendered flat it's a smoother Approach A; its real purpose is to feed Approach C.

**Approach C (the target): lit relief shading over the anatomy.**
From B's height field, compute per-pixel surface normals (finite differences of neighboring heights) and shade with one fixed soft light from the upper left: slopes facing the light brighten, slopes facing away darken, flat areas stay neutral. Tint with the gold ramp by height. The result reads as smooth bumps swelling out of the torso — the reference's look, in the fixed front view, composited above the anatomy layers (which keep their own motion: diaphragm morph, subtle body scale). Still zero dependencies; at ~120×130 resolution the per-frame cost is a few tens of thousands of arithmetic ops, trivial at 30 Hz. Optional polish: faint isolines (contour rings every few mm) for a topographic read; specular highlight kept minimal so the surface doesn't look wet.

Build A first to prove the plumbing, then B+C together as one phase. A remains as the reduced-motion / low-power fallback.

### Where it sits in the UI

- A **view toggle** on the stage: `Regions | Field`. Regions is today's per-compartment wash (kept — it's the better view for "compare left vs right" coaching and it matches the metrics/levels panels). Field is the new continuous view. Persist choice in localStorage; `v` key toggles (no collisions: space, arrows, `[`, `]` are taken).
- Default stays **Regions** until the therapist session says otherwise — Field is the demo-wow view, Regions is the teaching view, and the session (not aesthetics) should pick the default.
- The field renders in the same slot as the compartment wash: above the anatomy layers, below landmarks and hit-paths. Hover mm readouts keep working in both views (hit-paths are independent of the visual).
- Caption in Field view: "Motion field · interpolated from 6 regions · higher is more motion."
- Anatomy depth stepper works identically in both views. This is the "in conjunction" requirement: at the diaphragm depth, the dome morph animates *under* the relief surface, both driven by the same sample — the deep cause and the surface effect visible at once. The relief must stay translucent enough that the active anatomy layer reads through it.

### Interactions with existing features

- **Compare / replay / traces / Konno–Mead / metrics:** untouched; they read samples, not pixels.
- **Reduced motion:** the field itself is not an animation (it just re-renders per sample like everything else), so no special handling beyond what exists.
- **Left-quiet and frozen presets** are the acceptance stress test: in Field view, a quiet region must read as a *dim area*, not disappear into its bright neighbor's blob. This is the main tuning risk of Approach A — blob radii must not be so generous that they wash over a frozen neighbor.

## Handoff notes for the implementing agent

The agent implements **F1 and F2**. F3 is a human tuning session — do not attempt it; leave tunables (light angle, height exaggeration, falloff radius, ramp) as named constants in one place so the session can adjust them quickly.

Orientation (same repo rules as `docs/layered-anatomy-plan.md`, which was implemented successfully — read its "Agent orientation" section first):

- Stack: React + TypeScript + Vite, zero runtime dependencies beyond React. Keep it that way. No three.js, no WebGL, no chart/interp libraries.
- Where things live now: `src/components/TorsoMap.tsx` renders the figure — anatomy stack (`src/anatomy/AnatomyStack.tsx`, 6 layers with a depth stepper), then a glow pass and a wash pass over the compartment `PATHS` (from `src/components/torsoPaths.ts`), then bone lines, then landmarks. Color ramps are in `src/lib/color.ts`. The torso viewBox is `0 0 240 250`, clip path id `torso-clip`.
- The **Field view replaces the glow + wash passes** when active; anatomy stack, bone lines, landmarks, and the invisible hover hit-paths stay in both views.
- **Field sites**: derive centroids from the six compartment `PATHS` (hardcoding sensible centroid coordinates next to `PATHS` is fine — they're stable), plus the two lateral points from `sample.lateral` when present, mapped to the lateral rib landmarks. Keep the derivation in one pure function.
- Canvas integration (F2): render the height field on an offscreen canvas, draw it into the SVG via an `<image>` (data URL or `createImageBitmap` → object URL each frame is wasteful; prefer drawing the canvas positioned under/inside the SVG stage with CSS, clipped via `clip-path`, or use `<foreignObject>`). Choose the simplest approach that clips to the torso and layers correctly between anatomy and landmarks; document the choice in a comment.
- Keyboard: `v` toggles the view. Guard against typing targets exactly like the existing handlers (see the `[`/`]` handler in `TorsoMap.tsx`). Taken keys: space, arrows, `[`, `]`.
- `prefers-reduced-motion`: the relief (F2) falls back to the flat F1 render. There's an existing `matchMedia` listener in `TorsoMap.tsx` to reuse.
- Persistence: localStorage, follow the pattern of `somatic.anatomyDepth.v2` in `src/anatomy/layers.ts`.
- Verify with `npm run build` after each phase; check wide and ~420 px layouts in `npm run dev`. GitHub Pages base is `/somatic/` — no hardcoded absolute asset paths.
- Language guardrails: education not assessment; the caption strings in this plan are the approved wording. Never "heat", never "problem areas".
- Commit per phase, one-line messages matching history; push when both phases build clean.

## Phases

**F1 — Field sites + Approach A render + view toggle (½–1 day).**
Site derivation function, gradient-blob field, `Regions | Field` toggle with persistence and `v` key, caption. Proves the plumbing.
*Accept:* all seven presets distinguishable at a glance in Field view; "One region still" shows a visibly dead zone on the left lower ribs; hover still works; build clean; both breakpoints.

**F2 — Relief: canvas height field + lit shading (1 day).**
Approaches B and C as one phase: IDW height field, normal shading, gold-by-height tint, composited over the anatomy layers; A becomes the `prefers-reduced-motion` fallback. Verify the "conjunction" scene: abdominal preset at diaphragm depth shows the dome flattening beneath a belly that visibly swells.
*Accept:* same preset gates as F1 pass on the relief render; the bulge tracks the belly trace; active anatomy layer reads through the surface; 30 Hz with no visible jank on a mid-range laptop.

**F3 — Tuning pass with the therapist (session time, not code time).**
Light angle, height exaggeration, ramp, isolines on/off, default view. *Accept:* therapist picks a default and can narrate a session over the Field view without correcting it.

## Risks

- **Invented smoothness reads as measurement.** Mitigated by the caption, visible site landmarks, and education-not-assessment language. This is the one to watch in user testing.
- **Wash-over hides asymmetry** (the left-quiet failure mode). Tune interpolation falloff against the left-quiet and frozen presets first, not the symmetric ones.
- **Relief buries the anatomy.** The shaded surface competes with the layers it sits on. Budget: anatomy dim, relief translucent, light soft. If they still fight, the relief wins at Body depth and yields (more translucent) at anatomy depths.
- **Shading implies precision.** A lit 3D-looking surface reads as "measured shape." Same mitigation as smoothness: caption plus visible sample sites; and the height exaggeration factor is stated in the caption if the therapist wants it ("~10× actual").
- **Two views split attention.** If the therapist only ever uses one, delete the other rather than maintaining both. The toggle is an experiment, not a commitment.
