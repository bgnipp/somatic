# Improvement pass 2 — findings and queue

*2026-08-16. A general review pass over the live prototype and the codebase: UI
consistency, bugs, robustness, and small feature opportunities. The first
improvement pass (P0–P3) is in `docs/improvement-plan.md`; everything from it
that mattered has shipped. **E1–E8 implemented the same day.***

## What was checked and found healthy

- **Narrow layout (400 px, emulated iPhone width):** no horizontal overflow in
  Regions, Field, Guide (front and back), or Compose mode. Pills wrap sanely,
  the legend wraps, the side inset fits.
- **Record → replay → compare → delete:** full loop exercised; take saved with
  correct duration, replay transport (play / loop / 0.5× / export) all present,
  delete works.
- **Guide clock:** incremental phase (no jump when switching scripts), pause /
  scrub / reduced-motion behavior all correct in code review.
- **Composer:** compile, stagger, stabilize group, layer auto-reveal (D4) all
  behave as specced.

---

## E1 — Guide-view consistency sweep (bug-class: measured data leaking into the scripted view)

We hid the phase pill in Guide because a mock-driven "Inhale/Exhale" label
contradicted the scripted loop. The same contradiction survives in three
places:

1. **Mid-thorax cross-section.** The gold section ellipse sits directly under
   the Guide legend and keeps breathing with the *mock stream* while the Guide
   plays its own loop. Two different breaths on screen at once.
   **Fix:** hide `CrossSection` when `view === "guide"` (App already owns
   `view`; one conditional).
2. **Compartment hover readout.** Hovering the figure in Guide replaces the
   Guide caption with "*Left upper chest · 3.2 mm from rest*" — a measurement
   from the mock stream, presented over the reference animation.
   **Fix:** in `TorsoMap`, skip the hover branch of the caption (and the hover
   stroke) when `showGuide`.
3. **Landmark dots.** "Points of interest" are measured-view furniture but
   render over the Guide front figure.
   **Fix:** `showLandmarks && !showGuide` instead of `!showBack` only.

**Done.** Cross-section hidden in Guide; hover mm readout and landmark dots
are measured-view only.

## E2 — Import robustness (real crash path)

`parseSession` (`src/storage/sessions.ts`) validates `id`, `samples.length`,
and `durationMs` — but **not the shape of the samples themselves**. An imported
JSON whose sample items lack `compartments` (or have non-numeric values)
passes validation, saves, and then crashes at open time when `sampleAt` /
`TorsoMap` read `s.compartments[id].displacementMm`.

Also: **import does not dedupe by id.** Importing the same file twice creates
two takes with the same `id` → duplicate React keys in the takes list, and
`deleteSession` (filter by id) silently removes both copies.

**Fix:**
- In `parseSession`, validate each sample: numeric `t`, and all six
  compartment ids present with numeric `displacementMm`. Reject the session
  (return null) if any sample fails — no partial repair.
- In `importFiles` (App), skip sessions whose `id` already exists in the list
  (imports win nothing over existing state; skipping is the honest behavior).

**Done.** `parseSession` rejects any session whose samples lack a numeric `t`
or any of the six compartment displacements. Import skips ids already in the
list (and duplicates within the incoming batch).

## E3 — Composer loop speed control (`holdMs` is dead state)

`Composition.holdMs` exists, is validated on load (2 000–20 000 ms), and drives
`cycleMs` of the compiled script — but **no UI sets it**. Composed loops are
permanently 6 s. Either wire it or delete it; wiring is more useful:

- A small three-way pill in the ComposerPanel: `Slow (10 s) · Medium (6 s) ·
  Fast (4 s)`, writing `holdMs`. Persistence and compile path already work.

**Done.** Fast / Medium / Slow pill in the Composer writes `holdMs`.

## E4 — Composer on phones: the action sentences vanish

At < 520 px the muscle-action `<span>` in each composer row is `display: none`.
That's the physician's "clinical definition of the action of each muscle" — the
part she explicitly asked for — invisible on exactly the device she's most
likely to review on.

**Fix:** replace the `display:none` rule with a two-line clamp
(`-webkit-line-clamp: 2`), or render the sentence under the label at full width
on narrow screens instead of beside it. Keep rows compact; don't hide content.

**Done.** Narrow layout stacks the row and two-line-clamps the sentence.

## E5 — Aspect badges on composition chips

Picking a back-only muscle auto-flips the figure, but only at pick time. A
mixed composition (e.g. transversus + rhomboids) always has picks that are
invisible in the current aspect, with no cue that they exist "on the other
side."

**Fix:** on each chip in the engage/release/stabilize lists, render a small
`front`/`back` badge when the muscle is *not* visible in the current aspect.
Data is already in the catalog (`aspects`); TorsoMap can pass `aspect` down.

**Done.** Chips whose muscle is not on the current aspect show a `front`/`back`
badge.

## E6 — Shareable state via URL params

`?scenario=` already round-trips. The review loop with the physician would get
meaningfully easier if view state did too:

- `?view=regions|field|guide`, `?script=quiet|supported|lengthen`,
  `?aspect=front|back` — read once on load (URL wins over localStorage), write
  on change like `scenario` does.
- Then "look at the supported exhale from the back" is one link in an iMessage
  instead of three instructions.

**Done.** `?view=`, `?script=`, and `?aspect=` read on load (URL wins over
localStorage) and write on change via `src/lib/urlState.ts`, merging with
`?scenario=` so writers don't clobber each other.

## E7 — Muscle inspector in Guide (catalog meets figure)

The catalog has a label + action sentence for all 17 muscles, but the figure
never surfaces them. Clicking/tapping a tinted muscle in Guide could show its
name and action sentence in the caption slot (which E1 frees up in Guide view).

- Cheap version: `title` + `aria-label` per tinted path group, plus a caption
  swap on click. No new layout.
- This also gives the back figure — currently unlabeled schematic shapes — a
  way to teach what each column *is*.

**Done.** Tapping a muscle group (front or back) swaps the Guide caption to
its catalog label + action. Tap again to clear.

## E8 — Smaller items (grab-bag, do opportunistically)

- **Aspect persistence is illusory.** Leaving Guide resets aspect to front and
  *saves* it, so the stored value is always "front" in practice. Either stop
  saving on the reset path or drop `loadStoredAspect` — current code just
  ships dead persistence.
- **Touch parity for compartment readouts.** Hover-only mm readouts do nothing
  on iPad/iPhone. LiveLevels covers the data, so this is low-stakes — but a
  tap-to-toggle on the compartment paths would be a few lines.
- **Konno–Mead loop direction.** The paradoxical preset reverses the loop's
  travel direction, but the chart doesn't show direction. A small arrowhead on
  the recent segment (or a fading tail, already partially present) would make
  paradox legible in the loop itself.
- **Take rename.** Takes are labeled preset + time only. Notes exist, but a
  tap-to-rename on the take label would help once more than ~5 takes exist.
- **Composer region-open state** resets on reload (all but Core collapse).
  Persist `open` next to the composition if it grates.

**Done.** Aspect is only persisted while Guide is open (leaving Guide no
longer overwrites storage with `front`). Compartment paths pin on tap for
touch. Konno–Mead draws a direction arrow at the live tip. Takes have a
rename control (`Session.label`). Composer region-open state persists
(`somatic.composerOpen.v1`).

## Suggested order

| Order | Item | Size | Why first |
| --- | --- | --- | --- |
| 1 | E1 Guide consistency sweep | S | Physician review is imminent; contradictions in the Guide are the worst kind of bug for credibility |
| 2 | E2 Import validation + dedupe | S | Only real crash path found |
| 3 | E4 Composer sentences on mobile | S | Her feature, her device |
| 4 | E3 holdMs control | S | Dead state → useful control |
| 5 | E6 URL params | M | Accelerates the whole review loop |
| 6 | E5 chip badges | S | Completes the mixed-aspect story |
| 7 | E7 muscle inspector | M | Teaching value; builds on E1 |
| 8 | E8 grab-bag | S each | As convenient |

Non-goals for this pass: video import (parked separately in
`docs/capture-plan.md`), Track H realistic renders, anything requiring new
physician input.
