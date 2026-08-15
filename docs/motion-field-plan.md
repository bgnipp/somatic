# Motion Field ("Heat Signature") — Plan

**Date:** 2026-08-15
**Status:** Plan only. Not implemented.
**Reference:** `docs/reference/motion-field/field-ref-*.png` — frames from a Schrödinger-equation animation the physician shared: a continuous field rendered as smooth animated peaks, intensity rising where amplitude is high.

## The idea, translated to our product

Today the torso heatmap is six compartment tiles that brighten with motion. The reference suggests replacing (or complementing) that with a **continuous motion field**: a smooth intensity surface over the torso that blooms organically where the body is moving, with no visible tile seams — the way a thermal camera image *looks*, but driven by displacement, not temperature.

## Does it make sense? Yes, with three caveats that shape the whole design.

**1. Honesty: we have six numbers, not a field.** Mock (and any near-term capture) samples six sites. A smooth field over the whole torso is an *interpolation* — pixels between sites are invented. That's acceptable for a teaching mirror if we say so: the landmark dots stay visible as the true sample sites, and the caption reads "field interpolated from 6 regions." When real capture arrives with denser markers, the same renderer just takes more sites — this feature is actually a good architectural bridge to dense capture.

**2. Naming: not "heat."** We measure motion. Calling it a heat signature invites two misreadings: that we sense temperature (medical thermography is a regulated diagnostic domain we must not gesture at), and that hot = bad. In-product name: **motion field**. Same guardrail language as today: brighter is more motion, not a problem.

**3. Color: keep one channel.** The reference's cyan/magenta/yellow rainbow is the wrong lesson — multi-hue reads as categories ("red = danger"). The field stays our single gold ramp: transparent at rest, brighter with motion. No thermal palette.

The genuinely valuable part of the reference is the **continuity and the animation**: seams disappear, motion looks alive, asymmetry (left dim, right bright) reads as one organic picture instead of a bar chart painted on a body.

## What NOT to take from the reference

- The literal 3D bump surface and the tilted-dish framing. A front-view mirror doesn't need 3D relief; the existing cross-section panel already covers "out of plane."
- The rainbow palette (above).
- WebGL/shader rendering — unnecessary for six-to-dozens of sites.

## Design

### Data contract

A small, source-agnostic addition — no change to `Sample`:

- `FieldSite = { x, y, mm }` in torso viewBox coordinates.
- A pure function derives sites from a `Sample`: today, the six compartment centroids (plus the two lateral points when present). Later, camera markers map to sites 1:1. The renderer never knows where sites came from.

### Rendering — two candidate approaches, in order

**Approach A (recommended first): SVG radial-gradient blobs.**
One radial gradient per site, radius proportional to region size, opacity driven by that site's mm through the existing tone ramp, all blobs in a group blended with `lighter`/`screen` and softened with the existing blur filter, clipped to the torso. Overlapping blobs merge into one continuous field. Zero dependencies, ~30 lines of markup, cheap at 30 Hz, and visually already 80% of the reference. Risk: with only six sites the "field" may read as six soft circles; mitigate with generous radii and overlap.

**Approach B (if A isn't smooth enough): canvas IDW field.**
Offscreen `<canvas>` at low resolution (~120×130), per-pixel inverse-distance-weighted interpolation of the sites each frame, mapped to the gold alpha ramp, drawn under the SVG (or via `<image>`) with CSS blur, clipped to the torso path. True continuous surface, still dependency-free, slightly more code and per-frame cost (trivial at that resolution). Only build this if A's blobs are visibly blobby in a way that hurts.

Do not build both up front. Ship A, judge with eyes, escalate to B only on failure.

### Where it sits in the UI

- A **view toggle** on the stage: `Regions | Field`. Regions is today's per-compartment wash (kept — it's the better view for "compare left vs right" coaching and it matches the metrics/levels panels). Field is the new continuous view. Persist choice in localStorage; `v` key toggles (no collisions: space, arrows, `[`, `]` are taken).
- Default stays **Regions** until the therapist session says otherwise — Field is the demo-wow view, Regions is the teaching view, and the session (not aesthetics) should pick the default.
- The field renders in the same slot as the compartment wash: above the anatomy layers, below landmarks and hit-paths. Hover mm readouts keep working in both views (hit-paths are independent of the visual).
- Caption in Field view: "Motion field · interpolated from 6 regions · brighter is more motion."
- Anatomy depth stepper works identically in both views.

### Interactions with existing features

- **Compare / replay / traces / Konno–Mead / metrics:** untouched; they read samples, not pixels.
- **Reduced motion:** the field itself is not an animation (it just re-renders per sample like everything else), so no special handling beyond what exists.
- **Left-quiet and frozen presets** are the acceptance stress test: in Field view, a quiet region must read as a *dim area*, not disappear into its bright neighbor's blob. This is the main tuning risk of Approach A — blob radii must not be so generous that they wash over a frozen neighbor.

## Phases

**F1 — Field sites + Approach A render + view toggle (½–1 day).**
Site derivation function, gradient-blob field, `Regions | Field` toggle with persistence and `v` key, caption.
*Accept:* all seven presets distinguishable at a glance in Field view; "One region still" shows a visibly dead zone on the left lower ribs; hover still works; build clean; both breakpoints.

**F2 — Tuning pass with the therapist (session time, not code time).**
Radii, ramp, default view. *Accept:* therapist picks a default and can narrate a session over the Field view without correcting it.

**F3 (contingent) — Canvas IDW field.**
Only if F1's blobs fail the F1 acceptance visually. Same public surface, renderer swap.

## Risks

- **Invented smoothness reads as measurement.** Mitigated by the caption, visible site landmarks, and education-not-assessment language. This is the one to watch in user testing.
- **Blob wash-over hides asymmetry** (the left-quiet failure mode). Tune radii against those two presets first, not the symmetric ones.
- **Two views split attention.** If the therapist only ever uses one, delete the other rather than maintaining both. The toggle is an experiment, not a commitment.
