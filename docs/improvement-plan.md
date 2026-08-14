# Somatic — Improvement Plan

**Date:** 2026-08-14
**Purpose:** Implementation-ready task list for the next work session. Written to be executed without prior conversation context. Read `docs/mvp-plan.md` first for the product thesis and constraints.

## Context for the implementer

Somatic is a mock-data breath-visualization prototype (Vite + React + TypeScript, no backend, no dependencies beyond React). It deploys to GitHub Pages at https://bgnipp.github.io/somatic/ via `.github/workflows/pages.yml` on push to `main`.

Key files:

- `src/App.tsx` — all app state: live/recording/replay modes, scrub, sessions, notes
- `src/types.ts` — data contract (`CompartmentId`, `Sample`, `Session`, presets, landmarks). **Do not break this contract**; a future camera source must swap in behind `BreathSource`.
- `src/mock/synthesize.ts` — fake breath signal generator, 7 presets; helper means (`meanRibCage`, `meanAbdomen`, `meanLeft`, `meanRight`) and `sampleAt` interpolation
- `src/mock/MockBreathSource.ts` — rAF-driven source implementing `BreathSource`
- `src/components/` — `TorsoMap` (SVG figure, compartments clipped to silhouette via `#torso-clip`), `CrossSection`, `TracePanel`, `KonnoMead`, `LiveLevels`
- `src/storage/sessions.ts` — localStorage persistence + JSON export

### Hard guardrails (do not violate)

1. **No assessment language.** Never "problem", "dysfunction", "abnormal", "score", "good/bad". Motion is shown neutrally; the practitioner interprets. This keeps the tool out of medical-device territory.
2. **Data contract stays stable.** Additive changes to `Session` are fine (optional fields); renames/removals are not.
3. **No new npm dependencies** without strong justification. Everything so far is hand-rolled SVG.
4. **Displacement, not volume.** Do not compute or display lung volume.
5. Verify with `npm run build` (runs `tsc --noEmit` first). Visual checks at both ~1180px and ~740px widths — the layout collapses to one column below 880px.

---

## P0 — Verify and fix the record/replay loop

The record → stop → replay → scrub flow was implemented and worked in earlier builds, but the last automated smoke test was interrupted after the latest refactors. Verify end to end in a browser:

1. Click **Record**, wait ~10 s, click **Stop & save** → should enter replay mode with a scrubber, and the take appears under "Saved takes"
2. **Play/Pause**, drag the scrubber → torso and traces follow the scrub position
3. **Live mock** returns to live animation
4. Reload the page → saved take persists; opening it replays
5. **✕** deletes a take; deleting the currently-open take returns to live
6. **Export JSON** downloads the session

Fix whatever is broken. Known code smells to check while in there:

- `buffer` state in `App.tsx` is set on every recorded sample only to display elapsed time — derive elapsed from the latest sample instead and delete the `buffer` state (keep `bufferRef`).
- If recording produces fewer than 8 samples, `stopRecording` silently returns to live; that's acceptable, but make sure the UI doesn't get stuck.

**Acceptance:** all six steps above pass in a clean browser profile (empty localStorage).

## P1 — Highest-value additions

### 1.1 Breath metrics strip (biggest usefulness win)

Add a compact metrics row computed from the rolling `history` (live) or the full take (replay). New component `src/components/Metrics.tsx`, rendered in the console above `TracePanel`.

- **Breaths/min:** count peaks of `meanRibCage + meanAbdomen` over the window (simple local-maximum detection with a minimum prominence ~1 mm and minimum spacing ~1.5 s). Show one decimal.
- **Chest:belly balance:** ratio of rib-cage excursion (max−min over window) to abdomen excursion, displayed as e.g. "35 : 65" (normalized to sum 100).
- **L / R balance:** same idea using `meanLeft` / `meanRight`, displayed "48 : 52".
- **Phase gap:** cross-correlation lag between rib-cage and abdomen traces at the dominant period, displayed in degrees ("~90° offset") or "in phase" below 20°.
- Language rule: these are descriptions, not scores. No targets, no ranges, no coloring by value. Neutral ink.
- Show "—" until ~8 s of data exists.

**Acceptance:** metrics update live; switching presets visibly changes them (abdominal-dominant ≈ belly-heavy balance; asynchrony ≈ ~90° phase gap; left-quiet ≈ L/R visibly uneven). Values stable to ±10% frame-to-frame (compute over the whole window, not per frame).

### 1.2 Before/after compare (the core teaching flow)

The practitioner's actual loop is: record baseline → touch/cue → record again → compare. Support it minimally:

- In replay mode, add a "Compare with…" select listing other saved takes.
- When a comparison is chosen, render a second set of traces (dashed or dimmer) overlaid on `TracePanel`, aligned at t=0, and a second Konno–Mead loop in a muted tone.
- Add A/B labels with the take timestamps. No torso-map diffing — traces only for now.

**Acceptance:** record two takes of different presets, open one, compare with the other, see both trace sets clearly distinguishable; comparison clears when leaving replay.

### 1.3 Playback controls for teaching

- Loop toggle (replay restarts at end when on)
- Speed control: 0.5× / 1× (slow replay is how a teacher points mid-breath)
- Keyboard: space = record/stop (or play/pause in replay), ←/→ = scrub ±0.5 s. Ignore keys while the notes textarea is focused.

**Acceptance:** all three work; keyboard does nothing while typing notes.

## P2 — Visual and correctness polish

### 2.1 Figure refinement

The silhouette in `TorsoMap.tsx` is decent but still stiff. Without adding dependencies:

- Slight elbow bend so arms don't read as straight pipes (bow the forearm outward a few px around y≈150)
- Soften the shoulder-to-neck transition (trapezius slope instead of a hard corner)
- Keep everything inside the existing `#torso-clip` scheme; compartment geometry (`PATHS`) must continue to tile the torso without gaps at the midline
- Optional: 1–2px breathing scale on the whole torso group driven by total displacement (subtle, `transform-origin` at sternum), respecting `prefers-reduced-motion`

### 2.2 Cross-section honesty

`CrossSection.tsx` currently derives lateral/posterior expansion from the same front-compartment signals — it's illustrative, not measured. Either (a) label it "illustrative" in the caption, or (b) extend `synthesize.ts` to emit distinct lateral signals per preset and drive it from those. Prefer (b) if quick: add optional `lateral_L`/`lateral_R` amplitudes per preset and thread them through (additive change to `Sample` is allowed as an optional field).

### 2.3 Accessibility

- The "Points of interest" checkbox reports `readonly` in accessibility snapshots — ensure it's a real controlled checkbox with a proper label association and keyboard toggle.
- Phase pill (`Inhale/Exhale/Still`): add `aria-live="polite"`.
- `prefers-reduced-motion`: when set, keep fills updating but disable any scale/pulse animation.
- Focus styles on all buttons (currently browser default on dark bg is faint).

### 2.4 Shareable scenario URL

Read `?scenario=<presetId>` on load; update the URL (replaceState) when the preset changes. Lets the practitioner bookmark "left quiet" for a lesson.

### 2.5 Session import

`sessions.ts` exports JSON; add import (file input in "Saved takes") that validates shape (`id`, `samples[]`, `durationMs` present; clamp to 24 takes) and adds to the list. Enables moving takes between machines — cheap groundwork for real-capture data review later.

## P3 — Nice-to-have

- OG/meta tags in `index.html` (title, description, og:image can wait)
- Konno–Mead: neutral dotted 45° reference line labeled "equal excursion" (no good/bad framing)
- Preset "what to look for" second line in the blurb (one sentence each, teaching-oriented, neutral)
- README screenshot

---

## Suggested commit sequence

1. P0 verification + `buffer` cleanup
2. 1.1 metrics strip
3. 1.2 compare
4. 1.3 playback controls
5. 2.1–2.3 visual/a11y batch
6. 2.4–2.5 + P3

Small commits, each pushed (Pages redeploys automatically, ~1 min).

---

## Product next steps (not implementation — for the humans)

1. **Put the current build in front of the therapist this week.** The success gate in `docs/mvp-plan.md` applies: can she tell presets apart at a glance, does a client ever *feel* a region after seeing it, does she change what she does mid-session? Fifteen minutes with a real practitioner outranks any feature above.
2. **Let her name the presets.** The current labels are engineering names; her vocabulary is the product.
3. **Only after the gate passes:** Phase 2 capture spike — four high-contrast stickers, one webcam, OpenCV blob tracking behind the existing `BreathSource` interface. Budget ~$50 and a weekend. The singing use case (see mvp-plan) relaxes accuracy needs since sung-phrase displacements are several times larger than quiet breathing.
4. **Decide the singing fork deliberately.** If the first users end up being voice teachers rather than somatic therapists, add synchronized audio recording (the `Session.audio` field is already reserved) before investing further in quiet-breathing metrics.
