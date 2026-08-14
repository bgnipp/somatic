# Somatic

A teaching mirror for quiet standing breath. The first version is a **mock studio**: a body map, points of interest, and a motion heatmap driven by fake data. No camera. Brightness means motion, not a problem.

This is visualization for education. It is not a medical device and does not assess breathing function.

## Run locally

```bash
npm install
npm run dev
```

## What’s in v0

- Six-compartment torso map (OEP model, split left/right)
- Mid-thorax cross-section so lateral / back expansion has somewhere to appear
- Seven mock scenarios, including two singing patterns
- Live traces and a Konno–Mead loop (rib cage × abdomen)
- Record 30–60s, scrub, replay, export JSON
- Sessions stay in this browser (`localStorage`)

Camera capture is a later swap behind the same `BreathSource` contract. See [docs/mvp-plan.md](docs/mvp-plan.md).

## Deploy

Pushes to `main` publish to GitHub Pages at `https://bgnipp.github.io/somatic/`.
