# Night lighting and Lisbon density review

Independent visual and geometry review, 28 October 2026. The earlier six-world review in `refinement-review.md` remains historical.

## Decision

**This refinement pass is reviewed and complete.** The corrected stair and road surfaces pass the independent geometry audit and final day/night captures. The denser Lisbon blocks, church, lighting treatment and corrected boat strings pass the scoped checks below. This is not a blanket approval of the next requested phase: the user has separately flagged railing alignment, which remains queued for correction and review.

## Evidence

The reviewer manually inspected actual renderer images, including matched baseline/refinement day and night views in `artifacts/night-baseline/` and `artifacts/night-refinement/`, then the corrected captures in `artifacts/night-final/`. These cover the Pena hill road and stairs from oblique and top-down angles, Lisbon neighborhoods and church, the Tagus, London launches, Dubai marina/yachts, the Taj and Agra streets, Bengaluru street lighting and Moon guidance markers. The final Lisbon boat pair is in `artifacts/night-boat-final/`. The final stair-foot/hill-road and Agra lantern pairs are in `artifacts/night-release-detail/`, captured from preview `gu6pbydag` after the terrain-bed correction.

The corrected stair preview was `https://rpg-isomaptric-n910cu10z-rahuls-projects-e625a0fb.vercel.app`; the final boat placement preview was `https://rpg-isomaptric-ej0nuejkc-rahuls-projects-e625a0fb.vercel.app`. Captures use the real game renderer, not generated artwork. Local audit artifacts are ignored review evidence, not production modules.

## Defects caught during review

1. The first replacement palace approach had large white wedges and an uphill/downhill hairpin. Independent raycasts found rendered steps as much as **2.233 scene units above the walking surface**. It was replaced with one monotonic stair flight and two resting landings, using a shared height profile for rendering and walking. The corrected flight is visibly supported and no longer has the wedges or reversal.
2. The first London festoon configuration used an oversized beam and unsupported height for small launches. The root corrected it to each boat's actual width, lowered it near the rail, shortened its span and supplied endpoint posts before the final render. The launch closeup shows the strings attached inside the hull footprint.
3. The first Lisbon festoon placement intersected the cabin glazing. Moving the strings outward to the railing line makes the bulbs visible outside the windows in the corrected closeup. This changes placement only, with no additional geometry or lights.
4. A denser independent stair audit found two residual terrain intersections at lateral step samples, the larger **0.052 scene units** near `(-58.515, -81.620)`. Lowering the narrow support bed, while preserving the shared step profile and road protection, resolves both. The final independent sample at that location has **0.040 units of positive clearance**.

## Independent geometry checks

- `artifacts/independent-road-audit.mjs lisbon` checks transformed building meshes against roads, then actual triangles, not just placement rectangles. Across **23 roads and 178 building roots**, it found **no building intersection with sampled asphalt**. The 83 outer-pavement hits were examined separately rather than treated as road collisions.
- `artifacts/independent-lisbon-sidewalk-audit.mjs` probes solid frontages at heights **0.4, 1.1 and 1.8** above the walking surface. Its **6,708 samples** found a minimum **0.625-unit** clearance from asphalt to frontage and none below 0.5. This is deliberately narrow pavement; with the existing 0.46-unit player collision radius, the character can straddle the road edge at the narrowest fronts. It is not a claim of a full-width, two-way sidewalk everywhere.
- `artifacts/independent-lisbon-height-audit.mjs` raycasts the actual road, terrain and stair meshes. **843 road samples** have no missing surface and at least **0.042 units of road clearance** above the terrain. Rendered road height differs from the analytic walking height by 0.042–0.082 units, within the character's existing 0.13-unit placement offset.
- The corrected stair flight was sampled at approximately 0.1-unit intervals across its center and ±0.7 lateral offsets: **681 samples, no missing tread, render/walk mismatch below 0.000001 units**, and at least **0.040 units of clearance above the actual terrain triangles**. Samples lie just inside the end-face boundaries to avoid floating-point edge ambiguity. The road results remain unchanged after the final support-bed correction.

## Visual findings

- **Lisbon:** Attached blocks are visibly denser and the narrower lanes still form clean junctions. Inspected front and side elevations have supported roofs, framed windows and balconies; no road/facade clipping was visible in these views. The new white church has a legible pediment, bell tower, pitched roof and side window bays. It is an architectural study, not a claim that a named church exists at this exact compressed map position. Pena's road now follows a gentle bench along the hillside; its character and traffic surface use the same graded terrain.
- **Agra:** The Taj's night marble is subtly brighter and cooler while retaining dark arch recesses and facade contrast. More street lamps and wider warm pools improve the inhabited streets without washing out the houses. The daytime marble still reads as opaque stone rather than a glowing surface.
- **Bengaluru:** Wider street-light pools increase local visibility while preserving foliage and building detail. The observed night pair has no new broad glow haze.
- **Moon Base:** Guidance markers are brighter and whiter at night. They remain small, distinct markers; the day view has no emissive wash over the terrain or habitat.
- **Boats:** London and Dubai closeups show selected warm cabins alongside unlit cabins, and small festoons near the rails. The corrected Lisbon strings sit outside the cabin glazing. Day captures restore dark glazing and hide the decorative glow. Water reflections remain restrained, with no new light fog around the vessels.
- **Final closeups:** The stair-foot pair shows exposed tread tops without the sampled grass intrusion; the hill-road pair retains continuous asphalt. Agra's lantern is a small warm accent placed inside the wooden hull and is absent in daytime, with no added broad halo over the river.

## Outstanding next-phase item

The user has requested another refinement phase, including railing alignment. This review does **not** clear the Pena retaining/railing line: the final stair-foot view still shows an awkward elevated return and terminal piece beside the bottom steps, separate from the corrected tread/terrain surface. Its alignment and the wider waterfront-railing review remain next-phase work. Further density/height/roof variation, Taj aura, people, UI/Moon changes and showcase recordings are likewise outside this completed pass.

## Performance and integration evidence

Source inspection confirms that boat accents use merged geometry, cached cabin-material variants and no additional point lights, shadow casters or per-frame lighting animation. Street lighting retains the existing **12-light pool**. The additional night detail is not implemented with one live light per bulb or window.

The root reports **193 passing checks/tests** after the final stair-edge follow-up, including day/night reversal and boat-lighting tests. Final Lisbon has **614,590 triangles and 1,378 meshes**, below the unchanged 650,000/1,500 caps. Its serial browser profile in `artifacts/night-final-frame-profile.json` used **1440×900, DPR 1, six seconds per day/night sample**, on an Apple M5 Max through ANGLE Metal. It measured **59.8–60.0 fps** across all six worlds, p95 frame intervals no greater than **16.8 ms**, and no browser errors. Lisbon measured 60.0 fps in both modes. The final terrain-bed and festoon-placement corrections do not add meshes or lights. These are root-run performance checks, not independent measurements by this reviewer; a short desktop profile does not establish the same performance on every device.

## Limits

This review checks the captured camera positions and sampled geometry, not every triangle, view or gameplay trajectory. Source inspection and automated checks support the visual review but do not replace it. The worlds remain compressed game miniatures; the Sintra excursion is explicitly an inset and the Moon base is fictional. No production source was edited by this reviewer.
