# World expansion: independent visual review

This is an acceptance ledger, not a claim that the supplied concept images are geographically accurate. The new real-city chapters use explicitly bounded districts. The Moon chapter is an invented bonus setting. The reviewer owns this document; builders own their world namespaces and the integrator owns shared loading, UI and release checks.

## Reference and review method

The concept images guide miniature composition, depth and greenery. Primary photographs and maps determine named architecture, relative positions, river banks and district coverage. A real-city scene must not acquire invented coastlines, duplicated monuments or relocated landmarks just to resemble the concept art.

Reviewed captures use a public HTTPS preview, 1600 × 1000 pixels, DPR 1, fixed scene time and paired camera settings. Every chapter needs an overview, top-down plan, main landmark close-up, street/character view, day/night pair and an angled orbit check. A changed constructor requires fresh captures; a passing source test alone does not close a visible defect.

Primary references:

- Bengaluru: [Karnataka Legislature](https://kla.kar.nic.in/council/vds.htm), [district tourism](https://bengaluruurban.nic.in/en/tourism/), and the actual civic-district aerial photograph on PDF page 6 of the [KSTDC pocket guide](https://kstdc.co/wp-content/uploads/2024/09/Bengaluru_Pocket_Hi_Res_compressed.pdf). The photograph confirms mature canopy, the red court's prominent gabled/columned central projection, and Vidhana Soudha's articulated central and corner pavilions.
- Agra: [official Taj architecture and layout](https://www.tajmahal.gov.in/architecture.aspx) and [exterior architecture](https://tajmahal.gov.in/the-taj-exteriors.aspx). One Taj, a north–south ceremonial axis, mosque west, Jawab east, Yamuna north and Mehtab across the river.
- Hyderabad: [district Charminar photographs and architecture](https://hyderabad.telangana.gov.in/tourist-place/charminar/) and [Musi corridor map](https://musi.telangana.gov.in/Media/AC.pdf). Four minarets and open axial arches; no invented central dome or surrounding ocean.
- Lisbon: [official bridge reference](https://www.visitlisboa.com/pt-pt/locais/ponte-25-de-abril), [Jerónimos Monastery](https://www.visitlisboa.com/en/places/jeronimos-monastery), and [Belém Tower heritage reference](https://www.culturaportugal.gov.pt/pt/conhecer/local/mmp-locais/torre-de-belem/). The chosen Belém–Alcântara/Almada extent excludes Baixa and Alfama rather than relocating them.

## Review 1: first rendered implementations

Evidence: `artifacts/first-worlds/` from preview `rpg-isomaptric-n1sgo3qbk-rahuls-projects-e625a0fb.vercel.app`, and `artifacts/second-worlds/` from preview `rpg-isomaptric-legdmuuoe-rahuls-projects-e625a0fb.vercel.app`.

| Chapter | Decision | Evidence and required correction |
| --- | --- | --- |
| Agra | Revision required | `agra-hero-day.png` and `agra-hero-night.png`: visible jagged black/white interference along smaller arch surrounds and the main iwan shoulders. `agra-initial-ui.png`: similar Great Gate trim artifact. Separate coplanar trim/wall faces and inspect oblique angles. |
| Agra | Revision required | `agra-topdown.png` and `agra-overview-day.png`: Taj Ganj housing reads as detached boxes in lawn plots. Introduce a bounded group of attached courtyard/terrace rows and paved lanes near the southern forecourt while preserving protected gardens and archaeological grounds. |
| Lisbon | Blocked | `lisbon-topdown.png` and both overviews: water wraps around the rear and sides of both banks. Lisbon and Almada read as invented islands. Extend land to the cutaway bounds; keep water in the Tagus-facing gap. |
| Lisbon | Blocked | Second-preview `lisbon-initial-ui.png`: MAAT's solid white shell is absent; ground shows through disconnected white ribs above dark glazing. Fix normals/material sides or geometry and verify the continuous supported shell from above and the waterfront. The first preview had a visible shell. |
| Lisbon | Revision required | Overview and initial UI: nearly identical detached four-storey houses on lawns lack the attached street fabric and roof variation of the district. Reuse a small set of contiguous row/block archetypes with varied widths, heights, ridge directions, plaster and shutters. Preserve landmark plots and actual streets. |
| Lisbon | Revision required | Initial UI: Jerónimos reads as a generic compact church. Strengthen the long monastery wing/courtyard and church crown/portal proportions. Central Tejo's blue/orange roof striping resembles broken texture mapping or overlapping surfaces; inspect and correct. |
| Bengaluru | Revision required | `bengaluru-hero-day.png`: Vidhana Soudha reads as a smooth windowed ring with domes. Strengthen the projecting central pavilion/entablature below the dome, articulated corner pavilion bases, cornices and column capitals. Preserve its broad footprint and dome hierarchy. |
| Bengaluru | Revision required | Hero and initial UI: Attara Kacheri's broad blank red ends and repeated rectangular windows lose the prominent gabled, columned central projection visible in the KSTDC aerial. Improve this recognizable elevation and its window surrounds. |
| Bengaluru | Revision required | Overview/initial UI: Cubbon Park reads as evenly scattered saplings; cluster larger mature crowns in several reused scale bands while keeping paths and landmark sightlines clear. Repeated perimeter blocks need a small amount of width/height/roof/balcony variety. |
| Bengaluru | Revision required | Overview: the cutaway is a thin board compared with the substantial London/Dubai miniature. Increase visual slab depth without moving walkable ground or changing road heights. |
| Hyderabad | Pending | No implementation captures reviewed yet. |
| Moon | Pending | No implementation captures reviewed yet. |

What passed this round:

- Agra's district ordering, single Taj, dome/chhatri/minaret hierarchy and red/white subsidiary contrast are recognizable. Its river remains a river and no invented bridge appears. Night treatment avoids excessive glow.
- Bengaluru's inland civic/park crop and broad spatial ordering are coherent. Observed path joins are connected, and day/night lighting remains restrained.
- Lisbon's red suspension bridge is recognizable, its two-bank landmark ordering is coherent, and it retains restrained night lighting. Its bank presentation still blocks geographic acceptance.

Reported revisions awaiting a new render:

- Agra builder separated arch faces and trims, adjusted chamfer bay placement, and added eight batched Taj Ganj rows representing 36 dwellings. Reported change: 638 → 639 meshes and 269.2k → 272.7k unique triangles. This is not yet a visual pass.
- Lisbon's pre-review fixes moved the Belém bastion south and supported its turrets, changed overview zoom to 0.95, and fitted glazing to MAAT. Belém needs a closer fresh capture; MAAT regressed visibly as recorded above.

## Review 2: Agra revision, Hyderabad and Moon

Evidence: `artifacts/third-worlds/` from preview `rpg-isomaptric-ftpgyekcs-rahuls-projects-e625a0fb.vercel.app`.

| Chapter | Decision | Evidence and required correction |
| --- | --- | --- |
| Agra | Requested visible revisions closed | `agra-hero-day.png` and `agra-initial-ui.png` show clean arch surrounds and Great Gate trim. Attached rows and paved Taj Ganj improve the urban reading in the overview. The original geometry/lighting pass stands; an angled orbit and integration/gameplay checks remain. |
| Hyderabad | Revision required | `hyderabad-hero-day.png` and initial UI show ordinary houses nearly competing with Charminar's height. Source uses 2.9–5.8-unit houses at five metres/unit: 14.5–29 m despite a three-storey facade. Lower the typical range to roughly 1.8–3.2 units, retain only occasional taller blocks, and preserve the approximately correctly scaled Charminar. |
| Hyderabad | Revision required | Pale, nearly identical house boxes dominate the overview. Use bounded muted ochre/plaster/terracotta differences, attached market rows, awnings and a few parapet/courtyard mass variations; do not add excessive saturation or emissive surfaces. |
| Moon | Blocked | Both overviews show no discernible crater bowls or rims. Verify that the terrain heightfield is actually visible and is not covered by another surface. The final render needs clear large and smaller depressions, raised rims and directional shadows while keeping travel paths usable. |
| Moon | Revision required | `moon-hero-day.png` and initial UI show regular plaid/checker texture repetition. Replace it with irregular cached multiscale regolith detail and let actual terrain geometry provide crater shading. |
| Moon | Revision required | Overview: two thin offset plates and a black rectangular layer below suggest floating sheets. Add a substantial continuous cutaway sidewall meeting the terrain boundary. |
| Moon | Revision required | Initial UI: the habitat upper-floor right corner has a broken dark triangular strip. Inspect normals/overlap. The habitat, lander and workshop also need restrained reusable panel/airlock/railing/antenna/pipe connection details to move beyond bare primitive masses. |

Hyderabad's inland crop, one Charminar, four open arches, observable road connections and restrained night lighting pass this round. The Musi is correctly outside the chosen Old City crop. Moon's fictional label, gray palette, absence of Earth water and restrained cyan emission pass; its terrain and base do not.

## Review 3: revised details and full landmark orbits

Evidence: `artifacts/fourth-worlds/`, `artifacts/fourth-details/` and `artifacts/final-orbit/`, rendered by preview `rpg-isomaptric-k0eij0vj7-rahuls-projects-e625a0fb.vercel.app`. The orbit set contains eight 900 × 600 views per new chapter, at 45-degree intervals, with the first four in day mode and the remaining four in night mode. These complement the 1600 × 1000 paired overview/detail captures. All 40 saved orbit images were manually inspected after recovery of the interrupted review.

| Chapter | Decision | Observed result |
| --- | --- | --- |
| Agra | Visual pass | Taj front, sides and rear retain clean open-arch silhouettes, chhatri/minaret hierarchy, attached podium and correctly ordered subsidiary buildings. Earlier arch interference is no longer visible. Taj Ganj has attached street fabric. Uniform district scale leaves the monument smaller than the concept image; enlarging it independently would undermine the geographic contract. |
| Bengaluru | Visual pass | Vidhana Soudha now has a projecting columned central pavilion, layered entablature, stair approach and articulated corner towers. Attara Kacheri has the recognizable red pediment and columned projection. Mixed mature canopy and a substantial cutaway replace the sapling/thin-board appearance. All eight landmark angles remain stable. |
| Hyderabad | Visual pass | Lower ordinary buildings restore Charminar's hierarchy. Four open arches, tiered minarets, upper arcade and roof mosque remain readable from every orbit angle; the four clock faces are present but small at this scale. Muted plaster families, parapets, awnings and attached market rows improve the streets. A closer gallery camera is preferable to an inaccurately enlarged landmark. |
| Lisbon | Earlier blockers closed; final detail revision requested | Both banks now continue to the cut edges, MAAT has a continuous supported white shell, Jerónimos has a longer articulated wing and visible cloister, and attached streets improve the district. However, the broad outer grass margin is entirely empty, and Central Tejo's exposed rear/end elevations are blank brick boxes in orbit views 3–6. Extend restrained landscape detail into the margin and apply reused architectural bays to exposed Tejo elevations before final approval. |
| Moon | Earlier blockers closed; final detail revision requested | Irregular regolith, visible crater bowls/rims and continuous deep sidewalls now read as a lunar terrain miniature. Habitat glazing/corners remain stable and emission is restrained. The large upper roof and flat doorway still lack the close-up craft of the baseline: add bounded roof-panel/service details and a framed pressure airlock using reused/merged geometry, without adding lights. |

The reviewer also compared the actual London and Dubai close-ups in `artifacts/second-worlds/`. These new chapters are procedural district miniatures with recognizable architectural structure, not photorealistic reproductions of the supplied illustrations. Simplified material surfaces and compressed minor street fabric must remain explicit in documentation. A very bright water/sky reflection at exact rear cardinal night angles is visible in Agra orbit 4 and Lisbon orbit 4; this is shared water shading rather than building glow, and does not obscure the landmarks in ordinary views.

## Performance and isolation evidence

At matched 1600 × 1000, DPR 1 and overview zoom 1.05, the integrator reported these renderer totals. They include rendering passes and are not the same metric as unique scene geometry:

| Chapter | Day calls | Night calls | Day triangles | Night triangles |
| --- | ---: | ---: | ---: | ---: |
| London | 4,668 | 5,297 | 5.03m | 5.33m |
| Dubai | 3,956 | 4,445 | 5.06m | 5.18m |
| Agra | 1,843 | 2,036 | 3.49m | 3.50m |
| Lisbon | 2,648 | 2,885 | 4.73m | 4.76m |
| Bengaluru | 986 | 1,121 | 2.95m | 2.95m |
| Hyderabad, preview 3 | 2,216 | 2,361 | 1.21m | 1.21m |
| Moon, preview 3 | 199 | 214 | 0.66m | 0.66m |

These workloads are below the existing chapter baselines, but they do not establish an interactive frame rate. Serial animated frame-time checks remain an integration gate. Keep the 12-light pool, one batched ground wash, instanced foliage, cached facade materials and bounded reflection; inland worlds must not spend work on invisible water/reflection.

The integrator reports a passing cold-network audit for the first four available chapters: only the selected plan/geometry was requested. The final audit must include every new world and the built import graph, with shared engine assets permitted but no eager inactive-world plan, model or texture loads.

## Final acceptance gate

Blockers: false geography or known landmark duplication; floating/missing major surfaces; inaccessible gameplay paths; inactive-world loading; exceeded agreed budgets or material performance regression.

Major revisions: recognizable silhouette or facade omissions; broken road joins; repetitive city fabric; unstable/coplanar details; excessive glow; insufficient miniature depth. Minor changes may remain only when they do not affect identity, gameplay or visual stability.

Before final sign-off, capture the revised landmark from front, side and rear, replay walking/Explore travel/Grenade Gun/planting, check bridge and boat clearance where relevant, inspect day/night from the same camera, and repeat London/Dubai regression checks. UI and performance approval belong to the integrator. All final documentation must describe these as artistic district miniatures, not surveyed navigation maps.

## Final visual sign-off

The final detail revisions were manually rechecked in `artifacts/final-details/` and `artifacts/final-worlds/`, captured from preview `rpg-isomaptric-ondbznxx5-rahuls-projects-e625a0fb.vercel.app`.

- **Lisbon passes the visual gate.** Day/night overviews now carry clustered greenery and additional attached streets into the formerly blank margins. Selected street continuations reach the cut edge cleanly. The fresh Central Tejo rear/side views show articulated brick pilasters, arched glazing and cornices on exposed elevations, without the earlier roof interference. MAAT's supported shell remains intact. The Belém bastion now stands on a stone apron connected to the quay rather than a lawn patch. Its exact shoreline offset remains an artistic simplification; this is not a survey of the tower's tidal setting.
- **Moon passes the visual gate.** Fresh low, rear and night views show coherent roof seams, grouped supported radiator/service units, connected conduits and a projecting pressure-door vestibule. The addition improves close-up craft without disturbing the previously accepted terrain, crater bowls, deep sidewall or glazing. It remains plainly a fictional bonus base with restrained lighting, not a representation of an existing lunar settlement.
- **Agra, Bengaluru and Hyderabad retain their visual passes** from the eight-angle review and fresh detail captures. No further constructor changes were needed for those chapters. Their landmarks retain readable silhouettes and district-scale relationships; surrounding minor architecture remains procedurally simplified.

No open visual blocker remains in the inspected views. This approval covers the scoped miniature quality bar: recognizable primary landmarks, coherent district composition, clean major surfaces and joins, purposeful close-up detail, and restrained day/night treatment. It does not claim photographic equivalence to the concept art or exact geographic navigation accuracy. The integration owner separately verifies final production loading isolation, teardown, gameplay, responsive UI and measured performance; those results belong in the release record.
