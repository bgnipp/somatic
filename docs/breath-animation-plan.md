# Breath Anatomy Animation — Physician Feedback, Assessment, Plan

**Date:** 2026-08-15
**Status:** Assessment + plan only. Do NOT implement yet — one physiology question must be settled with the physician first (see "Open questions"), and she should confirm the mode split below matches her intent.
**Sources:** Voice memo from the physician ("breath animation", 3.3 min, transcribed 2026-08-15) plus three YouTube shorts she sent (assessed below).

## What she asked for, in her words (condensed)

- Overall look: like the **Essential Anatomy 3D** app (the same app our `docs/reference/anatomy-layers/` screenshots and peel video come from).
- **The entire animation should oscillate** — muscles and ribs visibly expand and settle with the breath, not just overlays lighting up on a static figure.
- Include **the pelvic floor** in the layer stack.
- Show **which muscles relax during inhalation and which contract during exhalation**, using the heat-signature style of the Paul G "Schrödinger's Equation Animation" video (our existing `docs/reference/motion-field/` reference): **activating muscles turn red, relaxing muscles turn blue**.
- Her choreography of the breath:
  - The breath **starts with engaging the pelvic floor** and the diaphragm pulling down, "squishing the abdominal contents closer together."
  - **While the diaphragm relaxes, the rectus contracts** (exhale).
  - **Transversus always maintains tone.**
  - The most external muscles — **traps and rhomboids — relax** to let the thoracic cavity expand.
  - Muscles to show relaxing/activating: **levators (pelvic floor), transversus, internal & external obliques, intercostals, scalenes, platysma.**
- Use the **clinical definition of each muscle's action** to frame the coordination.

## Assessment — what this actually is

This is not an edit to the motion map. It is a **second mode**: a choreographed, model-driven teaching animation of the coordinated breath — "how a breath works," played on the layered anatomy figure. It differs from everything built so far in one fundamental way:

**Muscle activation is modeled, not measured.** Displacement (our current signal) is observable by camera; activation state (contracting vs relaxing) is not — that would need sEMG. So this animation cannot and must not present itself as biofeedback. It is a reference loop, like the Essential Anatomy app itself: canonical, scripted, always the same. That's fine — arguably it's the missing half of the product. The teaching mirror shows *your* breath; this shows *the* breath. Side by side they answer "what am I doing?" and "what should it look like?"

This framing also resolves the red/blue color question cleanly:

- **Measured views (Regions, Field): gold only, unchanged.** Brightness = motion. The single-channel guardrail in `docs/motion-field-plan.md` stands — in a measurement view, red/blue would smuggle in "good/bad."
- **Teaching animation (this mode): red/blue is correct.** Red = contracting, blue = relaxing/lengthening is a standard physiological convention (her explicit request), the data is a script rather than a measurement, and a persistent on-screen legend states the semantics. No assessment language; "contracting/relaxing" are the only words.

### Assessment of the three videos she sent

1. **Scapular glide** ([youtube.com/shorts/1V8PDPoxFT4](https://www.youtube.com/shorts/1V8PDPoxFT4)) — scapula gliding on the rib cage; serratus anterior, levator scapulae, rhomboids. **Directly relevant.** It supports her "traps and rhomboids relax" point: the shoulder girdle rides *on* the rib cage, so girdle tension caps rib expansion — a core singing-technique issue (shoulder/clavicular breathing). Implication: the superficial layer's roster should include the girdle muscles that must release (traps, rhomboids, levator scapulae), and the choreography animates them relaxing (blue) on inhale.
2. **Flail chest / paradoxical motion** ([youtube.com/shorts/RPWhYBFt2N8](https://www.youtube.com/shorts/RPWhYBFt2N8)) — a chest-wall segment moving *opposite* to the rest during breathing, plus a clear explanation of diaphragm → negative intrathoracic pressure → airflow. The trauma itself is irrelevant to us, but the **concept of paradoxical (direction-reversed) motion is very relevant**: "reverse breathing" (belly drawing in on inhale) is one of the most common patterns a somatic teacher corrects. Today our data contract is magnitude-only (`displacementMm ≥ 0`); direction is invisible. Insight logged: a future signed-displacement extension and a "paradoxical / reverse breather" mock preset would let the measured views show this pattern honestly. Also: the pressure-mechanics narration is a good script model for the teaching animation's caption text.
3. **Nanolive growth cone** ([youtube.com/shorts/SngXAGa4_as](https://www.youtube.com/shorts/SngXAGa4_as)) — label-free microscopy of a neuron's growth cone undulating in real time. No feature content for us; read it as an **aesthetic bar**: subtle, continuous, organic motion made visible without exaggeration. That is the quality target for the oscillation (gentle, alive), not a bouncy cartoon.

### Her physiology model, captured as choreography

The clinical actions she cites, arranged into the loop the animation would play. This table is the data model — each row becomes an activation curve keyed to breath phase.

| Structure | Inhale | Exhale | Notes |
|---|---|---|---|
| Pelvic floor (levator ani) | **Engages first** (per her memo — see open question) | Releases | She has the breath *start* here |
| Diaphragm | Contracts, descends (red) | Relaxes, domes up (blue) | Existing dome morph is the skeleton of this |
| Transversus abdominis | Tonic — **always maintains tone** | Tonic | Constant neutral-warm tint, never blue |
| Rectus abdominis | Relaxes/yields (blue) | **Contracts** (red) | "While the diaphragm relaxes, the rectus contracts" |
| Internal/external obliques | Yield (blue) | Contract (red) | Exhale/support musculature |
| Intercostals | External set active with rib expansion | Internal set with rib descent | Show as one layer tint unless she wants the split |
| Scalenes | Assist rib elevation (red, subtle) | Relax (blue) | Neck layer — new territory for the figure |
| Platysma | Relaxes | — | New; superficial neck |
| Traps & rhomboids | **Relax (blue)** to free the thoracic cavity | Neutral | Ties to the scapular-glide video |
| Rib cage + whole figure | Expands (geometry, not just tint) | Settles | "The entire animation should oscillate" |

## Open questions for the physician (blockers, ask before building)

1. **Which breath is this?** Her choreography — pelvic floor *contracting* to start the inhale, rectus contracting on exhale — describes an **actively supported breath** (singing/trained support), not quiet tidal breathing (where the pelvic floor typically descends and lengthens on inhale and exhale is passive). Both are legitimate; they are *different animations*. Does she want (a) quiet breath, (b) supported/singing breath, or (c) both as selectable protocols? The table above records her memo verbatim; do not "correct" it — ask.
2. **Scope of the neck:** scalenes and platysma extend the figure above the current crop. Extend the viewBox/figure, or defer the neck to a later pass?
3. **Confirm the mode split:** measured views stay gold; the red/blue activation encoding lives only in the teaching animation. Does that match her intent, or did she want activation colors on the live map? (If the latter, we need the "modeled, not measured" conversation.)

## Plan (do not implement until questions above are answered)

**B1 — Choreography data model.** A typed script: per-structure activation curves (0–1, signed for contract/relax) as pure functions of breath phase, one script per protocol (quiet / supported). No rendering. Mirrors how presets work today — this is just presets for *activation* instead of displacement.

**B2 — Activation tinting on the anatomy layers.** The existing placeholder muscle groups (and later the Track H renders) gain a red↔blue tint driven by the script, with legend ("red = contracting · blue = relaxing · reference animation, not your data"). Reuses the layer stack and depth stepper as-is; at any depth you see that stratum's activation.

**B3 — Whole-figure oscillation + pelvic floor layer.** Rib cage arcs widen and the silhouette scales subtly with phase (a few viewBox units, honoring `prefers-reduced-motion`); a seventh anatomy layer `pelvic_floor` (schematic dome in the pelvic bowl, placeholder first, Track H render later) that lifts/releases per the script. The diaphragm morph (G4) becomes part of this choreography.
**B4 — Mode entry + review.** A clearly separated "Guide" (name TBD) entry so nobody mistakes the reference loop for their own data; then a review session with the physician, same format as the F3 tuning pass.

Dependencies: B2–B3 build on the existing anatomy stack (`docs/layered-anatomy-plan.md`) and coexist with the motion field (`docs/motion-field-plan.md`) — one is a script player, the other a sample renderer; they never share a color channel.

## Guardrails carried forward

- Education, not assessment: "contracting/relaxing," never "weak/tight/dysfunctional."
- The legend and mode separation must make it impossible to read the animation as the user's own measurement.
- Zero new dependencies; the choreography is math + the existing SVG/canvas machinery.
- Layer additions (pelvic floor, neck) update `public/anatomy/README.md` and the Track H render list when implemented.
