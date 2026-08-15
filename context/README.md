# Context

Reference artifacts the app does not use at runtime: source transcripts, screenshots, and video frames that informed the plans in `docs/`. Nothing here ships in the build.

- `transcripts/` — conversation and voice-memo transcripts, plus captions from reference videos. Named `YYYY-MM-DD-<source>-<topic>.txt`. The 2026-08-14 practitioner conversation is kept local-only (gitignored), matching its original handling.
- `anatomy-layers/` — screenshots and video frames from a commercial 3D anatomy app's muscle peel (Essential Anatomy 3D style). **Licensing reference for layout and interaction only — never trace, sample, or re-render this imagery.** See `docs/layered-anatomy-plan.md`.
- `motion-field/` — frames from the Paul G "Schrödinger's Equation Animation" video the physician shared as the heat-signature style reference. See `docs/motion-field-plan.md` and `docs/breath-animation-plan.md`.
