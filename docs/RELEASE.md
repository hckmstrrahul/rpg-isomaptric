# World release validation

## 29 October 2026 · Taj surface lighting

The Taj’s layered silhouette halo is removed. A white directional fill now affects only cloned marble materials on the monument, keeping its arches dark and surrounding buildings unchanged. It follows Moon reveal, restores the daytime finish, and adds no geometry, outline, global bloom or extra light pool.


Updated: 28 October 2026. Same Node.js 24 / Three.js / Vite toolchain as the first release. The lockfile remains authoritative.

## Six-world refinement

Hyderabad has been removed. Bengaluru, Agra and Lisbon now have connected street surfaces, approach-aligned signals and tested circulating traffic. Bengaluru adds office towers and cyclists, repairs roof faces/seat heights, and enlarges Vidhana Soudha. Agra enlarges its Taj and dry precinct by 1.7× and adds 184 varied dwellings. Lisbon now has 822 dwellings, narrower residential streets, varied heights, deeper terracotta roofs, gently rolling neighborhoods, two white Portuguese parish/civic studies, 25 mixed vessels, bridge traffic and a wooded **Pena Palace · Sintra** corner inset. The palace's location is an explicitly disclosed artistic inclusion.

Tiered fountains in Bengaluru and Lisbon share animated water geometry; Moon Base adds gold-foil satellites, batched guidance lights and subtle crater relief on its minimap. All worlds retain the default subtitle and start the explorer on accessible ground near the center. Discoveries update the counter without toasts.

The backdrop now comes from the full-screen scene background, with a transparent shadow receiver. Day/night renders at low orbit angles show no exposed ground-plane edge in any world. Independent review also samples actual transformed building triangles along road centers, asphalt edges and pavements; it distinguishes intended overhead structures from road collisions. [Latest refinement review](latest-refinement-review.md); [preceding night and hill-road review](night-refinement-review.md); [previous six-world review](refinement-review.md). The earlier reviews below are retained as historical records.

Road polygon union runs once at construction. Curbs are subtracted from the asphalt footprint on curved terrain, with adaptive height subdivision and redundant collinear points removed before triangulation. Fountains animate one shared water uniform per world; satellites and guide markers add no realtime lights. The shared pool remains limited to twelve local lights. Cold browser loading checks continue to reject requests for inactive worlds.

The Lisbon hill road follows a graded bench with a maximum sampled slope of 1.67%. Its separate stone staircase has level treads and two resting landings; rendering and walking use the same discrete heights. The retaining edge is grounded, capped and ends before the independent stair bed. MAAT and Central Tejo align with the bank while leaving the promenade open. Curved corner aprons fit the narrower traffic routes without retessellating the whole network; a thirteenth signal junction resolves the bridge/viewpoint crossing while retaining twelve local-light slots.

Agra has 83 street and garden lamps (previously 62). Its marble brightens progressively with Moon reveal, smoother dome reflections and one depth-tested silhouette-aura batch, restoring the original finish by day. Seventy-two tourists share four instanced batches, with real-home routes, staggered dawn exits and a reserved pedestrian crossing. Rowers and passengers share one cached geometry batch per boat. Bengaluru, Agra and Lisbon have brighter, wider street lighting within the unchanged twelve-light pool. Selected boats use cached warm cabin materials and supported deck strings; Yamuna rowboats use small lanterns. Lunar road markers glow brighter in one shared batch. These accents add no real lights or global bloom increase.

Reset has been removed; Follow uses its compass icon and Grenade Gun uses a gun icon. The north-up minimap has a separate camera-heading needle. Moon textures are uploaded before entrance and keep a consistent depth/render order. Clicking the visible Moon sphere opens Moon Base without firing or flying; its halo is not a target. Direct, remembered and selected Moon loads use **“To the moon...”** from the initial HTML frame.

**211 automated tests pass**, plus city/UI audits, TypeScript, the production build and all six static loading graphs. New checks cover joined road faces, separate apron subtraction, shared adaptive triangle edges, dense hill-road/curb clearance, bridge landings, supported roofs, central arrivals, sustained signalized traffic, visitor home routes and reversal, saved-night visitor initialization, boat crews, Moon targeting and compass headings. `npm audit --omit=dev` reports zero known production dependency vulnerabilities.

Lisbon's final scene inventory remains within the unchanged budget at **1,403 meshes / 649,559 triangles**; Agra uses **787 meshes / 343,911 triangles**. These counts exclude instance multiplication and additional shadow/reflection passes. Pooled lights and bounded reflections remain unchanged.

Serial Chrome samples on the final release preview, at 1440×900 and DPR 1 on Apple M5 Max, held approximately **60 fps in all six worlds, by day and night**, with p95 frame times of 16.7–16.8 ms and no page errors. Each settled sample spans six seconds; this is a bounded desktop measurement, not a low-end-device guarantee. The additional crowd, aura and denser streets remain inside these measured frame budgets.

Fresh browser contexts passed all six selected-world loading checks: no inactive world's plan or geometry was requested, no page errors occurred, and the writable capture API was absent from the normal build.

The ordinary-control browser workflow passed chapter selection, persisted night appearance, fresh sandbox state, walking/firing/planting, and a usable history return after GPU teardown. UI/Moon interaction and first-paint checks are recorded in [UI-AUDIT.md](UI-AUDIT.md); independent image and visitor lifecycle review is in [latest-refinement-review.md](latest-refinement-review.md).

## Previous seven-world expansion

Five selected-only chapters add Bengaluru’s civic/Cubbon Park district, Agra’s Taj riverfront, Hyderabad’s Old City, Lisbon’s Belém–Alcântara/Almada district and the explicitly fictional Moon Base. [Production plan and primary sources](WORLD-EXPANSION.md); [independent visual review ledger](WORLD-VISUAL-REVIEW.md).

The shared engine uses one active `WorldPlan` for terrain, roads, collision, maps, tree placement, aim and flight clearance. Cold-network checks cover all seven locations and reject inactive plan/geometry requests. London’s optional imported asset loader and Dubai lettering remain chapter-specific. Dry worlds skip reflections, and the lunar bonus skips Earth-view Moon textures. Page-hide teardown releases GPU resources, CPU vertex/instance arrays and texture image references; browser history returns rebuild a usable scene.

**173 automated tests pass**, along with city/UI audits, TypeScript, the production build and all seven static loading graphs. Checks cover geometry budgets, actual river banks and land, reachable arrivals, road and traffic clearance, bridge/boat clearance, open heritage arches, lunar crater picking, tree placement on hills and resource disposal. Ordinary browser controls passed walking, firing, planting, persisted appearance, keyboard chapter selection and history return across all locations. Independent day/night, landmark front/side/rear and overview review is recorded in the linked ledger. The final automated suite retains the original celestial-Moon regressions separately from the fictional-world tests. `npm audit` reports zero known dependency vulnerabilities.

Serial animated samples on Apple M5 Max / Chrome ANGLE Metal, 1440 × 900, DPR 1, six seconds per world/theme after settling, on the final reviewed preview:

| World | Day fps | Night fps | Worst p95 frame |
| --- | ---: | ---: | ---: |
| london | 60.0 | 60.0 | 16.7 ms |
| dubai | 60.0 | 60.0 | 16.8 ms |
| bengaluru | 60.0 | 60.0 | 16.7 ms |
| agra | 60.0 | 60.0 | 16.8 ms |
| hyderabad | 60.0 | 60.0 | 16.8 ms |
| lisbon | 60.0 | 60.0 | 16.7 ms |
| moon | 60.0 | 60.0 | 16.8 ms |

These are bounded desktop measurements, not guarantees for every device. The five new chapters meet the existing scene workload budget without adding per-window lights or unbounded reflections. The ordinary UI workflow also passed all-seven-world walking, firing, planting, persisted night mode and browser-history restoration; responsive/Explore-flight checks passed London, Moon and Lisbon at 320, 390, 820 and 1440 pixels.

Ten new day/night README images are actual renderer captures and are never loaded by the game. Reproduce with `node scripts/capture-world-gallery.mjs HTTPS_CAPTURE_PREVIEW`.

## Explore toolbar update

The toolbar now contains Explore, Grenade Gun and Plant a Tree. The duplicate Teleport tab, panel, keyboard shortcut and unused ghost/glide runtime are removed. Explore retains validated click/tap flight and its smooth zoom return. The header link row has a 12px top gap, increased from 8px; the toolbar uses three columns on desktop and mobile. Visible labels are “Explore,” “Grenade Gun” and “Plant a Tree,” with “Space to plant” for the tree action. The north compass straddles the minimap’s upper-right corner with reserved mobile clearance.

That toolbar release contained 137 passing tests, including facade variation and bounded night emission, after removing four cases specific to the retired teleport selector/glide. City/UI audits, TypeScript and the production build pass. The browser smoke workflow now exercises travel through ordinary Explore clicks instead of the removed selector.

## Previous Dubai refinement checks and measured scope

- **140 automated tests pass**, plus the existing city and UI audits, TypeScript and production build.
- Dubai checks construct the actual scene: all nine destinations connect on foot, building footprints leave roads clear, routes avoid static obstacles, all three bridges clear swept boat bounds, and traffic circulates over ten simulated minutes with the explorer at the starting promenade.
- Geometry is finite; palms release collision and reuse their own instance slots. Three road widths remain 3.2, 4 and 4.7 metres. Outer-sea targeting uses water height.
- Real Chrome checks passed for **both chapters**: saved-theme first paint, walking, ghost teleport, preserved zoom, Birdview, smooth Explore flight, and touch layouts at 320, 390 and 820 pixels.
- Chapter switching was checked in both directions, including arrow-key/Space activation, selected-state semantics, desktop header alignment and persisted night mode. Dubai's ordinary bomb/plant controls cleared four objects and planted a tree. No browser page errors were reported.
- `npm audit` reported **zero known vulnerabilities** during validation.

These browser runs are simulations, not physical-device certification. Geometry inventories and tests are not universal frame-rate guarantees.

## Facade and museum refinement

The museum now has a larger, heavier left shoulder and an offset elliptical opening, with dense, upright calligraphic courses and subdued silver reflections. Tower finishes and window occupancy differ by building: smooth blue and dark glass, silver/bronze fins, teal/pale bands and punched limestone windows. No extra dynamic lights or global bloom increase are used.

A fixed-time Chrome comparison at 1600 × 1000, DPR 1, counted all shadow/reflection/composer passes: the night overview changed from **4,443 to 4,460 draw calls** (+0.4%) and **5,215,498 to 5,176,986 triangles** (−0.7%). Day skyline draw calls changed from 3,651 to 3,676 (+0.7%). These are workload measurements, not a frame-rate promise. All scene and lighting budgets still pass.

## Marina and architecture refinement

The harbour boundary and road now share a circular centre; the promenade is continuous, junction anchors use mitered joins and butt ends, and bridge roads widen along sampled ramps. Regression checks cover these joins, walking clearance and bridge deck elevations.

The skyline adds recognizable Burj Khalifa, Cayan, Emirates and Index forms. Burj Al Arab occupies the west coast. The Museum of the Future replaces the floating sail roofs with an enlarged, grounded silver torus, a true open void, panel seams and calligraphic glazing. Twenty docked yachts and six moving sailboats accompany the motor fleet. The new tests verify named model presence, the height hierarchy, the museum void, stable berths and route clearance.

## Dubai budget

The completed world has 28 skyline towers, the coastal Burj Al Arab, 27 residences, three sculptural waterfront landmarks, 1,100 trees/palms, 1,800 low shrubs, 147 lamps, 36 vehicles, 18 moving yachts and 20 moored yachts. It measures **1,394 meshes / 493,547 unique triangles**, below the measured London baseline of **1,629 / 819,256**. Instance copies and additional render passes are excluded from that CPU inventory.

Both chapters retain the 12-point-light pool, one batched ground-wash draw, bounded reflection resolution/frequency and reusable effects. Dubai adds one 111 kB self-hosted Arabic font, with its bundled OFL license, and no downloaded model/texture pack and skips approximately 835 kB of London-specific optional assets. Only one chapter scene is constructed at a time.

Production keeps chapter geometry in lazy chunks. The shared engine is approximately 856 kB / 256 kB gzip; notifications remain a separate 257 kB / 79 kB gzip chunk. The shared engine still exceeds Vite's 500 kB advisory threshold. No dependency was added for the new architecture, marina or Arabic font.

Eight Dubai images in `docs/media/` are actual renderer captures. Reproduce them with `node scripts/capture-dubai.mjs HTTPS_CAPTURE_PREVIEW`; capture builds require `VITE_CAPTURE=1`. Production omits the writable capture API. The runtime inspection name `__littleLondon` remains compatible with existing tooling and now reports the active world.

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
