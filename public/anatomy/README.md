# Anatomy layer renders

Drop Track H PNGs here. Filenames must match the manifest in `src/anatomy/layers.ts`:

| File | Layer | Depth |
|------|-------|-------|
| `skeleton.png` | Rib cage, sternum, clavicles, lumbar hint, pelvis | 1 |
| `deep.png` | Diaphragm, psoas, transversus, pelvic floor | 2 |
| `intercostal.png` | Intercostal wall | 3 |
| `ab-wall.png` | Rectus abdominis, internal/external obliques | 4 |
| `superficial.png` | Pec major, pec minor, deltoid, upper traps | 5 |
| `surface.png` | Soft body wash | 6 |

Each file is isolated (that layer only, transparent background), framed to the torso SVG viewBox `0 0 240 250`. See the anchor table at the top of `src/anatomy/layers.ts`. Until a file is present, the app draws the schematic SVG placeholder.

Do not commit imagery traced from the commercial reference screenshots in `context/anatomy-layers/`.

Back-figure Track H renders (future, not yet in the front-layer manifest) should use reserved filenames `back-skeleton.png`, `back-deep.png`, `back-superficial.png`, framed to the same viewBox `0 0 240 250`. Until those exist the Guide back aspect draws the schematic SVG in `src/anatomy/backPlaceholders.tsx`.
