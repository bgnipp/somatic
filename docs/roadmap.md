# Roadmap — done vs. remaining

**Date:** 2026-08-16
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
| Fourth physician video ("Unbunch Your Ribs", endorsed "right on") transcribed and assessed: thesis validation, posterior-expansion capture requirement, candidate third Guide script | `docs/breath-animation-plan.md` §Fourth video | this commit |
| **Guide view (B1–B4):** scripted Quiet / Supported breath animation — red/blue activation tints, pelvic floor, rib oscillation, `Regions \| Field \| Guide` toggle (`g` key), pause/scrub, reduced-motion freeze | `docs/breath-animation-plan.md` | `0290b9a`, `b20d19b`, `a86d2e5`, `29f08c0` |
| Physician iMessage follow-up applied: solid-at-full activation gradient, exhale rib pull-in/down, SCM | `docs/breath-animation-plan.md` §Physician follow-up | `31ddc6e` |
| **Paradoxical timing preset** (belly anti-phase to ribs — the "reverse breather", magnitude-only) + mock-stream phase pill hidden in Guide view | (was backlog) | `e2b17a9` |
| **Platysma** + **sagittal side inset** showing the supported exhale's slight C-curve (front view can't show sagittal flexion) | (was backlog) | `e59f254` |
| **Third Guide script "Rib lengthening"** (held directions loop from the endorsed video: sternum forward/up, ribs back/up, lower front narrowing; no activation tints; new `ribLift`/`sternumLift` drivers; side inset data-driven) | `docs/breath-animation-plan.md` §Fourth video | this commit |
| **C-track (C1–C5):** muscle catalog as data; pec pair in supported script; schematic back figure (`Front \| Back`, `b`); composer compiles ordered engage/release groups into a `GuideScript` | `docs/muscle-catalog-composer-plan.md` | `e56ed64`, `c02e810`, `dea13cb`, `5c99745` |
| Physician follow-up #3 captured (balancing/opposing stabilizer tension; two Muscle&Motion-style reference shorts assessed as visual refs) and turned into the D-track above | `docs/breath-animation-plan.md` §Follow-up #3, `context/transcripts/2026-08-16-physician-balancing-stabilizers.txt` | `13857af` |
| **D4 — Composer layer-visibility fix:** picks whose layer the depth rail hid now tint visibly (floor opacity 0.85 on picked muscles' layers in Compose mode; depth rail governs the rest) | `docs/muscle-catalog-composer-plan.md` §C4 addendum | `15b51cf` |
| **D1–D3 — Stabilizer counter-tension:** dual-hump erector/intertransversarii curves in the supported script; legend names faint red as stabilizing tension; composer Stabilize group (peak 0.45) | `docs/breath-animation-plan.md` §Follow-up #3 | this commit |

## Remaining — agent work, ready now

None. Next agent work is the gated P2-a video-file import, or human items below.

## Remaining — human work

| Work | Plan doc | Notes |
|---|---|---|
| **Track H:** Blender renders of the 6 anatomy layers from Z-Anatomy (H0 licensing/pipeline spike, H1 full render set) | `docs/layered-anatomy-plan.md` §Track H | `deep.png` should include the pelvic floor dome (now part of Diaphragm & core) |
| **F3:** motion-field tuning session with the therapist (light angle, exaggeration, default view) | `docs/motion-field-plan.md` §F3 | Session time, not code time |
| **Therapist success-gate session** | `docs/mvp-plan.md` §Success gate | Gates all capture (Phase 2) work |
| **Physician review of the quiet-breath choreography table** | `docs/breath-animation-plan.md` §Open questions | Neck scope and color scope were answered in her 2026-08-15 iMessage follow-up (acted on same day) |
| **Physician review of the "Rib lengthening" Guide script** | `docs/breath-animation-plan.md` §Fourth video | Implemented at the user's direction from the video she endorsed; her review decides whether it stays (it renders one school's postural doctrine — trivial to remove) |
| **Get the "BT osteopathy animation" link from her** | `docs/breath-animation-plan.md` §Follow-up #2 | Needed before encoding richer default curves for the posterior roster and pec-minor detail |
| **Physician review of the back figure and composer** | `docs/muscle-catalog-composer-plan.md` §Open questions | Schematic back roster + select-order-as-light-order shipped; her eye decides grouping, art, and whether onsets should become editable |
| **Ask her open question 8: scapular anchoring vs. "traps and rhomboids relax"** | `docs/breath-animation-plan.md` §Open questions | Gates the rhomboid stabilizer curve in D1; the rest of D1 doesn't wait on it |

## Remaining — agent work, gated (plan exists)

| Work | Plan doc | Gate |
|---|---|---|
| **P2-a — Video-file import** (film 30–60 s on a phone, open the file in the site — processed fully on-device, no upload; drag chest/belly/reference boxes on the first frame; optical flow → a replayable `Session` in relative units) | `docs/capture-plan.md` §P2-a | Formally the therapist success-gate session; $0 cost, so starting early is a risk decision the user can make |
| **P2-a′ — live webcam mode**, **P2-b — markers + mm calibration**, **P2-c — depth camera** | `docs/capture-plan.md` | P2-a results + hardware decisions (human) |

## Remaining — agent work, blocked

| Work | Blocked on | Plan doc |
|---|---|---|
| **H2:** re-trace compartment `PATHS`/`LANDMARKS` onto real skeleton render; re-tune glow legibility | Track H renders | `docs/layered-anatomy-plan.md` §H2 |

## Backlog (captured, not planned in detail)

- **Signed displacement** (true negative excursion in the data contract). The paradoxical-timing preset ships the observable half (anti-phase timing, magnitude-only); real signed data would additionally let a region read "drawn inward" at capture time. Revisit in the camera era — touches color ramps, metrics, and the relief field.
- **Motion recording, later versions (physician, 2026-08-15):** after the basic breath is mapped, add motion recording — possibly a combination of EMG, acupuncture-needle mapping, and motion tracking. Aligns with the existing Phase 2 capture plan; EMG would also make the Guide's activation colors measurable someday.
- **Full side-view figure.** The Guide's schematic side inset covers the C-curve for now; a full side view with its own compartments is a capture-era question.
- **Posterior expansion capture (capture-era requirement, upgraded from nice-to-have):** the rib-geometry video's school holds that the back and upper rib cage expand most; a front-only camera cannot see it, and large anterior motion can be *compensation* for a blocked back. Multi-view or posterior capture should be a named requirement of the Phase 2+ design — and the "brightness is motion, not a problem" copy must never drift toward "more motion = better."
- ~~Muscle catalog + composer~~ and ~~back-view figure~~: **promoted to the C-track above** — planned in detail in `docs/muscle-catalog-composer-plan.md`.
- **Phase 2 capture spike** (4 markers + webcam behind `BreathSource`): gated on the therapist success-gate session.
- **Installation mode / therapist-named presets:** parked open questions in `docs/mvp-plan.md` (back view promoted to its own item above).
