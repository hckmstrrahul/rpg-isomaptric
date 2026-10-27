# London + Dubai release validation

Release date: 27 October 2026. Same Node.js 24 / Three.js / Vite toolchain as the first release. The lockfile remains authoritative.

## Checks and measured scope

- **136 automated tests pass**, plus the existing city and UI audits, TypeScript and production build.
- Dubai checks construct the actual scene: all eight destinations connect on foot, building footprints leave roads clear, routes avoid static obstacles, all three bridges clear swept boat bounds, and traffic circulates over ten simulated minutes with the explorer at the starting promenade.
- Geometry is finite; palms release collision and reuse their own instance slots. Three road widths remain 3.2, 4 and 4.7 metres. Outer-sea targeting uses water height.
- Real Chrome checks passed for **both chapters**: saved-theme first paint, walking, ghost teleport, preserved zoom, Birdview, smooth Explore flight, and touch layouts at 320, 390 and 820 pixels.
- Chapter switching was checked in both directions, including arrow-key/Space activation, selected-state semantics, desktop header alignment and persisted night mode. Dubai's ordinary bomb/plant controls cleared four objects and planted a tree. No browser page errors were reported.
- `npm audit` reported **zero known vulnerabilities** during validation.

These browser runs are simulations, not physical-device certification. Geometry inventories and tests are not universal frame-rate guarantees.

## Dubai budget

The completed world has 27 towers, 31 residences, three sculptural waterfront landmarks, 1,100 trees/palms, 1,800 low shrubs, 151 lamps, 36 vehicles and 18 boats. It measures **1,278 meshes / 449,219 unique triangles**, below the measured London baseline of **1,629 / 819,256**. Instance copies and additional render passes are excluded from that CPU inventory.

Both chapters retain the 12-point-light pool, one batched ground-wash draw, bounded reflection resolution/frequency and reusable effects. Dubai adds no downloaded asset pack and skips approximately 835 kB of London-specific optional assets. Only one chapter scene is constructed at a time.

Production chunks are approximately 855 kB (255 kB gzip) for the shared main engine, 18 kB (8 kB gzip) for Dubai, 38 kB (17 kB gzip) for London, and 43 kB (17 kB gzip) for shared world helpers. Notifications remain a separate 257 kB / 79 kB gzip chunk. The shared engine still exceeds Vite's 500 kB advisory threshold.

Four Dubai images in `docs/media/` are actual renderer captures. Reproduce them with `node scripts/capture-dubai.mjs HTTPS_CAPTURE_PREVIEW`; capture builds require `VITE_CAPTURE=1`. Production omits the writable capture API. The runtime inspection name `__littleLondon` remains compatible with existing tooling and now reports the active world.

```sh
npm run check
npm audit
npm run check:browser -- 'https://rpg-isomaptric.vercel.app/?world=london' --production
npm run check:browser -- 'https://rpg-isomaptric.vercel.app/?world=dubai' --production
node scripts/check-world-switching.mjs https://rpg-isomaptric.vercel.app
```

The earlier release record follows for historical measurements.

---

# London release · 26 October 2026

Release date: 26 October 2026. Node.js 24.13.0; Vite 7.3.7; Three.js 0.180.0. The repository lockfile is the authoritative dependency snapshot.

## Automated checks

- **127 tests pass**, covering the constructed city, geometry, navigation, gameplay, lighting, movement and input.
- City audit: **zero failures** across 24 roads, 62 buildings, 950 trees and 246 static props. It also checks 252 street-corner samples and 100 outer-edge samples.
- UI audit: 16 opaque and 10 glass contrast pairs pass; 29 HUD buttons have source-level accessible names and valid ARIA references.
- TypeScript and the Vite production build pass.
- `npm audit`: zero known dependency vulnerabilities at release validation time.

These are separate from GPU rendering checks. Full detail for UI verification boundaries is in [UI-AUDIT.md](UI-AUDIT.md).

## Payload and optimization

The release reduces build transformation work from roughly 6,129 modules to 130 by importing only the used Hugeicons modules. This is a build-work improvement, not a claimed frame-rate gain. One 48.26 kB Latin variable-font file replaces seven shipped font files. Optional city assets and lunar maps load concurrently.

| Artifact | Approximate size | Loading behavior |
| --- | ---: | --- |
| Main JavaScript | 924 kB / 283 kB gzip | Application engine and world |
| Notifications JavaScript | 257 kB / 79 kB gzip | Separate dynamically imported React/Sonner chunk |
| CSS | 20 kB / 5 kB gzip | Interface styles |
| Inter Latin variable font | 48 kB | Local font, swap display |
| Social MP4 | 2.0 MB | Six seconds, 960×540, H.264, no audio; never requested by the game |
| README GIF | 2.3 MB | 400×225, 8 fps, infinite loop; documentation only |

The renderer retains instanced trees, merged static meshes, batched ground glows, a 12-light local pool, a 20 Hz reflection limit and reusable effects. Asset fidelity, tree density and landmark detail were preserved in this release. The NVIDIA derivative model remains 3,797 triangles, with its model and six maps totaling 834,910 bytes.

The main JavaScript chunk exceeds Vite's 500 kB advisory threshold. Splitting code arbitrarily would not reduce the bytes needed to build the city, so the warning remains visible. No universal FPS or low-end-mobile performance claim is made. Browser/GPU measurements vary with device, resolution and driver.

## Media and sharing

Day, night, landmark and character screenshots are real engine renders. The favicon is a transparent render of the explorer's modeled head. Open Graph and Twitter metadata use **rpg isomaptric** and **Tiny playable isometric worlds**, with a 1200×630 JPEG fallback and optional short MP4. Video support varies by sharing platform.

Capture requires an explicit preview build flag. Normal production builds omit `window.__capture`; read-only runtime inspection remains available through `window.__littleLondon.getState()`. Temporary frame files and raw reports are ignored by git.

## Reproduce

```sh
npm ci
npm run check
npm audit
npm run check:browser -- https://rpg-isomaptric.vercel.app --production
```

Browser smoke checks use installed Google Chrome in a fresh Playwright context against the HTTPS deployment. They check saved day/night first paint against the opposite system preference, Explore selection, header link, keyboard walking, keyboard ghost teleport with preserved zoom, Birdview, persisted theme toggles, full-motion flight zoom return, and touch layouts at 390×844, 820×1180 and 320×740. Reports and screenshots are written to ignored `artifacts/`.

## Observed browser results

The release preview passed every smoke check with **zero page errors**. Desktop verification used 1440×900. Touch-layout checks passed at 390×844, 820×1180 and 320×740 with no horizontal document overflow and all inspected controls inside the viewport. These are browser simulations, not physical-device certification.

Saved night loaded on its first HTML frame with `rgb(37, 45, 51)` despite a light system preference; saved day loaded with `rgb(251, 250, 239)` despite a dark system preference. Keyboard teleport preserved 6× zoom. Birdview selected 3×. The full-motion flight sample eased from approximately 5.99× down to 5.18× and returned to exactly its starting zoom. Media capture also completed without page errors.
