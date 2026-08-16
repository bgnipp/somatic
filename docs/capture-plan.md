# Capture proposal — the input/camera step (Phase 2)

**Date:** 2026-08-16
**Status:** Proposal. Nothing here is implemented. Formally gated on the therapist success-gate session (`docs/mvp-plan.md` §Success gate), but the webcam spike (P2-a) costs nothing and can start whenever we choose to accept that risk.
**Reads first:** `docs/mvp-plan.md` §Prior art and §Accuracy reality check — the sensor conclusions there still hold and are assumed below.

## Goal

Replace the mock stream with a measurement of the actual person standing in front of the screen, behind the existing contract:

```ts
interface BreathSource {
  start(): void;
  stop(): void;
  subscribe(cb: (sample: Sample) => void): Unsubscribe;
}
```

Everything downstream — map, field, traces, metrics, record/replay, export — already consumes `Sample` and does not change. That was the point of locking the contract in v0.

What the contract demands: per-compartment displacement for 6 regions (upper/lower ribs L/R, abdomen L/R) at ~20–30 Hz, resolving a signal of roughly 1–12 mm.

## The physics problem, stated honestly

**A front-facing camera looks straight down the axis of the motion we care most about.** Anterior–posterior (AP) excursion of the chest and belly is motion *toward* a front camera — it produces almost no image-plane displacement, only a sub-pixel scale change and shading shifts. What a front view *does* see well:

- **Lateral rib expansion** (the cage widens — in-plane, visible),
- **Vertical rib/clavicle elevation** (in-plane, visible),
- **Timing** of all of the above.

What a **profile (side) view** sees well is the opposite: chest AP and belly AP excursion become in-plane motion — large, easy, and exactly the Konno–Mead pair — at the cost of the L/R comparison.

So the camera angle is not a detail; it selects which teaching questions the rig can answer:

| Teaching question | Best cheap view |
|---|---|
| Chest vs belly balance, phase gap, **paradoxical timing** | **Profile** — both signals in-plane |
| Left/right asymmetry | **Front** — lateral rib excursion |
| Clavicular/apical pattern | Front (vertical clavicle motion) |
| Posterior expansion | **Neither.** Documented limitation (`docs/breath-animation-plan.md` §Fourth video); do not overclaim |

A depth camera (iPhone TrueDepth/LiDAR, RealSense) dissolves the dichotomy — AP displacement is read directly per pixel from a front view — which is why it is the stage-2 rig, not the starting point.

## A load-bearing simplification: most of our value is ratios and timing

Breaths/min, chest:belly balance, left:right balance, phase gap, the paradox pattern, the Konno–Mead loop shape — **none of these need absolute millimeters.** They need clean relative amplitude and timing. Only the "mm from rest" readouts need calibration, and those can be honestly labeled in relative units until a scale reference exists.

Proposed contract addition (additive, old takes unaffected):

```ts
type Session = {
  // ...existing fields
  source?: "mock" | "camera";        // absent = mock (legacy takes)
  units?: "mm" | "relative";         // absent = mm (mock is modeled mm)
};
```

When `units === "relative"`, the UI shows unitless levels and hides the mm labels; the ceiling auto-normalizes to the session's own range. This keeps us honest without blocking on calibration.

## Options considered

1. **Markerless pose estimation — ruled out for measurement, permanently** (mvp-plan: landmark jitter 5–20 mm ≥ the signal). One legitimate use survives: locating the torso once, so the six ROIs place themselves. Placement, not measurement.
2. **Region-based optical flow on a plain webcam — the P2-a spike.** Dense/LK flow averaged over each compartment ROI. Sub-pixel when averaged over thousands of pixels; recovers timing everywhere and amplitude for in-plane motion (per the view table above). $0 hardware, runs in the browser, nothing leaves the device.
3. **High-contrast markers + one RGB camera — the P2-b upgrade.** 4–6 stickers on a fitted shirt tracked at sub-pixel; matches the published feasibility rig the MVP plan cites (timing + thoraco-abdominal asynchrony from exactly this setup). A known marker size or spacing gives px→mm, unlocking `units: "mm"`. ~$20.
4. **Depth camera — the P2-c rig.** iPhone TrueDepth streamed to the browser (e.g. Record3D's WebRTC path) or a RealSense on the laptop. True AP mm per compartment from a front view — L/R *and* chest/belly simultaneously — at ~2–8 mm noise, mitigated by ROI averaging and the breath-band filter. $0 if an iPhone is on hand.
5. **RIP/piezo belt** — companion ground truth for phase during validation, never the product. **mmWave radar, force plate** — later candidates, unchanged. **EMG / needle mapping** (her later-versions list) — separate track, not camera work.

## Recommended path

### P2-a — Video-file import, profile view (~$0) — **the chosen easiest entry, 2026-08-16**

Not live capture: the user films 30–60 s of quiet standing on a phone (propped/tripod, profile view, fitted top), opens the site, and picks the file. **Nothing is uploaded** — there is no backend; the browser decodes and processes the file entirely on-device, and only the derived numbers exist afterward. This is easier than live capture in every dimension:

- **Reuses replay instead of the live path.** The pipeline produces a `Session` — the same JSON as a recorded take — which lands in Saved takes: scrubbable, replayable, exportable, comparable against mock takes. No `getUserMedia`, no permissions, no real-time budget.
- **Two-pass processing.** Offline, pass 1 scans the whole clip for the rest baseline and sway floor; pass 2 extracts the signal against them. Live capture has to guess its baseline up front.
- **Manual ROI placement on a still frame.** Show the first frame; the therapist drags a **chest box** and a **belly box** (profile view), plus a **reference box** on static background/pelvis whose flow is subtracted as common-mode (sway + stabilization residue). More robust than automatic placement and zero dependencies.
- Pipeline: `<input type="file">` → `<video>` + `requestVideoFrameCallback` (`mediaTime` for timestamps) → downscaled grayscale → per-ROI optical flow (hand-rolled LK/block matching) → reference-box subtraction → band-pass 0.05–1 Hz → `Sample[]`, `units: "relative"`, `source: "camera"`. In profile the six compartments collapse to a 2×1 column (chest, abdomen); L/R mirrors the measured column with a caption stating so.
- **Video-specific challenges:** iPhone stabilization warps frames to cancel hand shake (fabricates motion — tripod defeats most of it, the reference box catches the rest); auto-exposure drift reads as brightness change (long-press AE/AF lock in the camera app; goes in the filming instructions). Codecs are fine in practice (Safari native HEVC; Chrome hardware HEVC decode).

*Accept:* a phone clip of belly-dominant vs chest-dominant breathing produces visibly different maps and a correct Konno–Mead loop; deliberate reverse breathing reproduces the paradox pattern; the imported take replays, scrubs, and exports like any mock take. Human required: someone must film and be filmed.

**Live webcam mode** (camera picker, 5 s still baseline, live map) becomes P2-a′ — the same flow code pointed at a stream instead of a file, built only after the file path proves the signal. Front-view mode (true 6-compartment L/R from lateral+vertical flow) ships with whichever comes second.

### P2-b — Markers + calibration (~$20)

Fitted shirt, 4–6 high-contrast dots, sub-pixel centroid tracking replacing raw flow in the ROIs; marker spacing measured once with a tape gives px→mm; `units: "mm"`. Validate against a belt or simple caliper rig.

### P2-c — Depth (iPhone TrueDepth / RealSense, $0–400)

Same `BreathSource` interface, per-compartment median depth deltas. Decision on native app vs streaming bridge is taken here, not before.

## Challenges (the honest list)

1. **The optical-axis problem** — mitigated by choosing the view per question (above); dissolved only by depth capture.
2. **Postural sway is the same magnitude as breathing.** Quiet standing sways several mm at 0.1–0.5 Hz — inside the breath band, so filtering alone cannot remove it. Mitigations: reference ROI (pelvis/hip flow subtracted as common-mode), the baseline still-capture to measure the individual's sway floor, and captions that show total motion honestly rather than pretending it's all breath.
3. **Clothing decouples from the body wall.** Loose fabric moves on its own; require a fitted top (session-protocol note, not a software fix). This is a real constraint on the singing use case's "walk in and go" convenience.
4. **Auto-exposure/auto-focus flicker** masquerades as motion. Lock via `MediaStreamTrack.applyConstraints` where supported; detect and warn where not.
5. **Calibration to mm** needs a physical reference (marker spacing). Until then `relative` units — acceptable because of the ratios-and-timing argument, but the mm readouts and the 12 mm ceiling logic must respect the `units` field.
6. **L/R claims sit near the noise floor** even from the front. Gate the left:right metric on a per-session SNR estimate; show "—" rather than noise (the metrics deadband pattern from `16b9c51` extends naturally).
7. **Posterior expansion is invisible to every rig here.** Already a named guardrail; capture-era copy must repeat it.
8. **Privacy.** All processing on-device in the browser; no backend exists (GitHub Pages), no frames are stored — only the derived `Sample` stream ever touches localStorage/export. State this in the UI. Session recordings of clients are the therapist's clinical responsibility; we store numbers, not video.
9. **Regulatory language.** Real measurement raises the stakes on wording: still education, still "motion, not a problem," no diagnosis. The existing guardrails carry over verbatim.
10. **Browser performance.** ROI flow at 320px/25 Hz is cheap (the relief field already does heavier per-pixel work); `requestVideoFrameCallback` + reuse of the existing rAF discipline. Degrade to 15 Hz before degrading resolution.
11. **Verification needs a human body.** An agent can build and unit-test the pipeline (synthetic moving-gradient videos as fixtures), but only a person in front of the camera validates it — every accept gate above includes a human session.

## What stays true from the MVP plan

- The success gate still comes first for any *spend* and for committing the therapist's time. P2-a is free and reversible; starting it early is a risk decision, not a plan change.
- Pose estimation stays ruled out for measurement.
- The mock presets remain the teaching vocabulary; camera mode is a new source, not a new UI.

## Open questions

1. Profile-first (physician's current questions) vs front-first (L/R vocabulary the presets teach)? Proposal says profile; cheap to revisit.
2. Does the therapist's room allow a stable profile camera position (tripod? laptop on a shelf?) — physical setup is a human task.
3. iPhone availability in the room (decides how soon P2-c is realistic).
4. Should camera takes be sharable JSON like mock takes by default, given they describe a real client's body? (Proposal: yes, but with an explicit export confirmation naming that.)
