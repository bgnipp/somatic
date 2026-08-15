# Anatomy layer renders

Drop Track H PNGs here. Filenames must match the manifest in `src/anatomy/layers.ts`:

| File | Layer | Depth |
|------|-------|-------|
| `skeleton.png` | Rib cage, sternum, clavicles, lumbar hint, pelvis | 1 |
| `deep.png` | Diaphragm, psoas, transversus | 2 |
| `intercostal.png` | Intercostal wall | 3 |
| `superficial.png` | Rectus, obliques, pecs | 4 |
| `surface.png` | Soft body wash | 5 |

Each file is isolated (that layer only, transparent background), framed to the torso SVG viewBox `0 0 240 250`. See the anchor table at the top of `src/anatomy/layers.ts`. Until a file is present, the app draws the schematic SVG placeholder.

Do not commit imagery traced from the commercial reference screenshots in `docs/reference/anatomy-layers/`.
