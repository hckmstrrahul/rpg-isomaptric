# Six-world refinement review

Independent visual review, 28 October 2026. This records the refinement after Hyderabad was removed; the earlier expansion review remains in `WORLD-VISUAL-REVIEW.md`.

## Current decision

**Visual signoff: no remaining release-blocking defects in the reviewed captures.** The first capture round exposed terrain entering the Pena hill road and the south bridge approach. Subsequent focused renders confirm those defects, the buried Pena rear glazing and the stepped hill boundary are corrected. Detailed evidence and inspection limits follow.

First-round preview: `https://rpg-isomaptric-ou2pl15e1-rahuls-projects-e625a0fb.vercel.app`.

## Evidence and method

- Manually inspected actual renderer images in `artifacts/refinement-review/` and `artifacts/refinement-details/`: day overviews, top-down roads, all six night hero views, 12 low-angle day/night backgrounds, and targeted landmark/housing/bridge/fountain/Moon views.
- Independently constructed all six worlds in separate Node processes. The read-only audit in `artifacts/independent-road-audit.mjs` computes transformed solid-mesh bounds, then raycasts actual building triangles along nearby road centerlines, asphalt edges and sidewalk edges at intervals of at most 0.45 scene units. It does not rely only on placement rectangles.
- The audit also checks each open road endpoint against other roads and the map cut edge. Reports are `artifacts/independent-road-{world}.json`. Artifacts are local review evidence, not production modules.
- A sampled triangle test is not an exhaustive proof of every possible overlap. It checks buildings against roads, not the terrain against road surfaces. The Lisbon failures illustrate why rendered inspection remains necessary.

## Independent geometry audit

| World | Roads/paths | Building roots | Result |
| --- | ---: | ---: | --- |
| London | 24 | 62 | No disconnected open road ends. London Eye's actual overhead span intersects the vertical road probe approximately 28–38 units above the road; this is not a ground-level collision. Green Dome's broad bounding box is a false positive. |
| Dubai | 17 | 59 | No actual building-triangle hits in sampled road corridors. The south-waterfront endpoint lies 0.065 units from the coastal centerline, well inside the joined road widths. Museum/tower bounding-box candidates do not intersect the actual road corridor. |
| Bengaluru | 9 | 45 | Open road ends reach the ±108 map boundary. No actual building-triangle hits; Vikasa Soudha's axis-aligned box is a false positive. |
| Agra | 9 | 104 | Open road ends reach the ±108 boundary. No building-bound candidates or actual triangle hits. |
| Lisbon | 23 | 158 | Open road ends reach the ±126 boundary. Sixteen broad bounding-box candidates, mostly oblique rows, produce no actual building-triangle hits. This does not clear the separately observed terrain intrusion. |
| Moon Base | 9 | 8 | Intentional access paths terminate at pads/buildings. Habitat entrance probes meet its steps and vestibule, as intended; no unrelated building obstruction found. |

## Verified visual improvements

- **Bengaluru:** Western streets now form a legible loop/junction instead of the acute V. Top-down views show joined asphalt and consistent pavement, and road exits reach the slab boundary. Vidhana Soudha has a broad stair, columned entrance, articulated pavilions and courtyard elevations. Attara Kacheri's roof slopes and gables close over the walls. The visible bungalow roofs are supported; source inspection confirms the repaired outward-facing slopes, gables and closed soffit. New fountain views show a raised basin, tiers, arcing jets and ripples.
- **Agra:** The larger Taj reads as the central landmark from overview and from front, side and rear. The four minarets, central dome, subsidiary domed pavilions, symmetrical red flanking buildings, raised platform and garden axis remain coherent after scaling. Housing is visibly denser, with parapets, tanks, varied heights and framed windows; the inspected streets do not cut through it.
- **Lisbon:** Both bank captures now show substantial attached housing coverage, supported roofs, visible front/side windows and road setbacks. The river has visibly more vessels, including a larger passenger ship, ferries and sailboats. The fountain is three-dimensional and its water has visible jets/ripples. The north bridge landing is visibly connected. The south landing and Pena hill road are not yet cleared.
- **Moon Base:** Both gold-bodied satellite additions are visible with panel wings and antenna detail. The minimap displays crater depressions as well as roads and structures. Habitat roof equipment and entrance remain legible in the night hero view.
- **London/Dubai regression review:** Top-down road networks remain joined, with no new obvious building/road intersections. Their night hero views retain the established material and lighting character. No source changes were made by this reviewer.
- **Shared background:** All six low-orbit day and night pairs have a continuous surrounding background. No rectangular ground-plane cutoff or black horizon wedge is visible in these 12 captures. Local cast shadows remain intentional.
- **Shared UI:** The inspected UI has the restored “Tiny playable isometric worlds” subtitle and six destinations, with no Hyderabad tab. Explore, Grenade Gun and Plant a Tree labels/subtext are correct in the Moon UI capture. A still image alone cannot prove the absence of a transient discovery toast.
- **Night treatment:** All six hero night images retain readable geometry and restrained lighting without a new glow washout. These are game miniatures, not a claim of photographic or survey-grade reproduction.

## First-pass defects requiring fresh evidence

1. **Pena hill road:** `lisbon-pena-front.png` and the north-housing view show large white triangular pavement fragments and grass crossing the road below the palace. The surrounding hill surface and road must be reviewed together after the builder's triangulation/terrain fix.
2. **South bridge landing:** In `lisbon-bridge-south.png`, grass covers approximately the right half of the approach above its intersection (image x775–825, y145–385). Road markings disappear under the terrain. Connectivity alone is insufficient; the finished road surface needs continuous clearance over the whole ramp.
3. **Pena rear windows:** The first rear capture shows cream-filled rear wing bays. Current source rotates complete window elevations outward, which appears to address the buried glazing, but source inspection is not visual signoff. Verify the rear and side elevations in a fresh render.

## Integration evidence supplied by the root agent

The root reports **185 passing checks/tests**, selected-world-only cold loading for all six destinations, and successful ordinary switching, walking, firing, planting and history checks. It also reports 60 fps day/night at 1440×900 DPR 1 for the five worlds unchanged in the final Lisbon correction, with no browser errors. Final Lisbon measures **622,365 triangles / 1,434 meshes**, and the root's serial browser profile reports 60 fps day/night with p95 frame intervals of 16.7/16.8 ms. These are root-run checks, not independent performance measurements by this reviewer. Device-specific performance is not guaranteed by one profile.

## Final Lisbon round

Preview `https://rpg-isomaptric-3i96upv0e-rahuls-projects-e625a0fb.vercel.app` was recaptured into the same Lisbon detail paths.

- The main Pena road's large triangular pavement fragments are gone. Its front path now reaches the gateway steps continuously. The revised layered bastion, arcade, entrance and tower group reads more coherently than the initial block-like facade.
- Pena rear and end elevations now have visible dark glazing inside the frames. The first-pass buried-glazing defect is resolved.
- Both bridge landing top-down views now show continuous asphalt and edge strips. The south approach's large grass crescent is gone, including where it meets the south junction. The wider shipping view confirms a supported span and approach.
- Two small areas remain for one last look: the rear hill's cut edge visibly steps between wall boxes, and the far-left hill road in `lisbon-north-housing.png` has residual pale fragments (approximately image x0–35, y445–505). The root has assigned the continuous cut-wall fix; the road detail was also reported for closer inspection. Final signoff is still pending this focused round.

Root reports 183 passing tests/checks and 623,126 Lisbon triangles / 1,433 meshes for this intermediate corrected preview. The unchanged budget remains in force.

### Final focused inspection

Final preview: `https://rpg-isomaptric-o9pfozyj5-rahuls-projects-e625a0fb.vercel.app`. Images were recaptured into `artifacts/refinement-details/`.

- Manually inspected `lisbon-hill-road-top.png`, `lisbon-hill-road-low.png`, `lisbon-pena-front.png`, `lisbon-pena-rear.png`, `lisbon-pena-night.png`, both bridge landings, the north housing view and the low night background.
- The former white road fragments are absent in the wider north-housing view and the close top/oblique road views. Pavement remains continuous, road paint is visible, and the palace path meets the curb without extending across the road.
- The rear cut wall follows the hill boundary continuously; the staircase-like wall-box silhouette is gone. The terrace and palace are grounded on the hill, with visible supported stairs and framed glazing on the inspected elevations.
- Both bridge approaches remain fully surfaced and joined to the street network. No return of the south grass crescent is visible.
- The final Pena night view keeps the dome ribs, window frames, terraces and gateway readable; local street lighting does not wash out the yellow/red facade or introduce a broad glow halo.
- Faint hairline tessellation/shading traces remain on parts of the hill road at close inspection zoom. They are a minor rendering limitation, not an open pavement wedge, disconnected road or terrain obstruction in these views.

The six-world refinement passes this manual review for release. This signoff covers the observed views and sampled geometry, not every possible camera position or a claim of perfect photographic fidelity. Landmark layouts remain compressed game miniatures; Pena is a labelled Sintra excursion inset and Moon Base is explicitly fictional.
