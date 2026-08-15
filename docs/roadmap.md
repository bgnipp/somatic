# Roadmap — done vs. remaining

**Date:** 2026-08-15
**Purpose:** The single source of truth for project state. Read this first; each work item links to the plan doc that specifies it. An implementing agent should pick the next "agent, ready" item and follow its plan doc exactly.

## Done (verified in `main`, deployed to GitHub Pages)

| Work | Plan doc | Evidence |
|---|---|---|
| Phase 0 mock studio: 6-compartment SVG torso map, `MockBreathSource`, 7 presets (5 standing + 2 singing), traces, record/replay/scrub/export/import, notes, localStorage | `docs/mvp-plan.md` | initial build commits through `979b3d5` |
| Improvement pass: live metrics (breaths/min, chest:belly, left:right, phase gap), compare view, playback controls, URL-shareable scenarios, Konno–Mead loop, cross-section, accessibility/reduced-motion | `docs/improvement-plan.md` | `5945a05` |
| Realistic body proportions redraw | (conversation-driven) | `1dac2a4` |
| **Track G (layered anatomy, all four phases):** G1 layer manifest + 6 schematic placeholder layers, G2 depth rail + `[`/`]` keys + persistence (`somatic.anatomyDepth.v2`), G3 bloom-only glow treatment, G4 diaphragm dome morph (`flatten` prop) | `docs/layered-anatomy-plan.md` | `4c4545d`, `fd43d4f`, `816cd5c`, `7e27c26`, `4e0f875`, `5cc3e71` |
| **Motion field F1 + F2:** field sites, flat blob field, `Regions | Field` toggle (`v` key, `somatic.mapView.v1`), canvas IDW height field with lit relief shading, reduced-motion fallback to blobs | `docs/motion-field-plan.md` | `ea7b5e2`, `b657d76` |
| Metrics flicker fix (16 s metrics buffer, deadband hold) | (bug fix) | `16b9c51` |
| Physician feedback captured: voice memo + 3 videos transcribed, assessed, planned | `docs/breath-animation-plan.md`, `context/transcripts/` | `ba60252`, `c77fd57` |
| **Guide view (B1–B4):** scripted Quiet / Supported breath animation — red/blue activation tints, pelvic floor, rib oscillation, `Regions \| Field \| Guide` toggle (`g` key), pause/scrub, reduced-motion freeze | `docs/breath-animation-plan.md` | `0290b9a`, `b20d19b`, `a86d2e5`, `29f08c0` |

## Remaining — agent work, ready now

None. Next agent work is blocked on human items below.

## Remaining — human work

| Work | Plan doc | Notes |
|---|---|---|
| **Track H:** Blender renders of the 6 anatomy layers from Z-Anatomy (H0 licensing/pipeline spike, H1 full render set) | `docs/layered-anatomy-plan.md` §Track H | `deep.png` should include the pelvic floor dome (now part of Diaphragm & core) |
| **F3:** motion-field tuning session with the therapist (light angle, exaggeration, default view) | `docs/motion-field-plan.md` §F3 | Session time, not code time |
| **Therapist success-gate session** | `docs/mvp-plan.md` §Success gate | Gates all capture (Phase 2) work |
| **Physician confirmations** for the Guide view | `docs/breath-animation-plan.md` §Open questions | Neck scope; color-scope confirmation; her review of the quiet-breath choreography table (quiet vs. supported was answered 2026-08-15: both ship, selectable) |

## Remaining — agent work, blocked

| Work | Blocked on | Plan doc |
|---|---|---|
| **H2:** re-trace compartment `PATHS`/`LANDMARKS` onto real skeleton render; re-tune glow legibility | Track H renders | `docs/layered-anatomy-plan.md` §H2 |

## Backlog (captured, not planned in detail)

- **Signed displacement + "reverse breather" preset.** Insight from the flail-chest video: direction of motion matters, not just magnitude. Would extend `CompartmentSample` with a signed convention (or a `paradoxical` flag per region in mocks) and a preset where the belly draws in on inhale. Needs its own mini-plan before implementation — touches color ramps (what does "inward" look like?), metrics, and the relief field.
- **Neck extension** (scalenes/platysma as first-class anatomy): pending physician's answer; B3 ships schematic scalene hints only.
- **Phase 2 capture spike** (4 markers + webcam behind `BreathSource`): gated on the therapist success-gate session.
- **Installation mode / back view / therapist-named presets:** parked open questions in `docs/mvp-plan.md`.
