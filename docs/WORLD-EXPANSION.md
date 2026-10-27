# World expansion: geography, craft and loading

The five new chapters are Bengaluru, Agra, Hyderabad, Lisbon and **Moon Base — a fictional bonus world**. Hyderabad combines the two supplied concepts into one location. London and Dubai remain available with the same character, Explore flight, Grenade Gun, planting and day/night controls.

The supplied artwork establishes miniature scale, layered landscaping and architectural detail. It is not a geographic source. Real city districts determine the water, street topology and landmark relationships; invented coastlines, duplicate monuments and impossible bridges in the artwork are excluded. These are simplified, artistically scaled playable districts, not navigation maps.

## Production process

1. Establish a north-up district boundary and uniform coordinate projection. Cross-check landmark placement against official maps, tourism/heritage sources and photographs. Record out-of-bounds landmarks instead of moving them into the scene.
2. Build water and terrain first, then one connected road/pavement network. Place grounded landmark footprints and verify arrival points and walk routes before decorative detail.
3. Model each landmark's silhouette, structural supports, entrances, roof/dome hierarchy and material transitions from photographs. Surround it with district-specific housing, planting and street furniture.
4. Add restrained warm/cool nighttime variation through materials and a bounded pool of local lights. Use shared instanced vegetation, merged static geometry, cached procedural textures and the existing reflection budget.
5. Run geometry, collision, reachability, traffic, water and complexity checks. An independent visual-review agent examines fixed day/night overviews, top-down plans, landmark closeups and street angles; issues go back to each builder.
6. Verify the shared character, flight, destruction, planting, touch controls and city switcher. Recheck London and Dubai. Record actual renderer workload and cold-network requests; do not equate mesh counts with frame rate.
7. Publish only after the reviewed build passes its checks. Keep references, limitations and review evidence alongside the implementation.

## Chapter ownership and scope

| Chapter | Geographic scope and defining forms | Deliberate exclusions |
| --- | --- | --- |
| Bengaluru | Inland Cubbon Park civic district; broad granite Vidhana Soudha, red Attara Kacheri, library, park canopy and surrounding civic streets | Ocean, invented cathedral, distant landmarks moved into the park |
| Agra | Taj riverfront and Taj Ganj; one Taj, four detached minarets, mosque west, Jawab east, garden and Great Gate south; Mehtab Bagh across the Yamuna | Duplicate Taj, circular canal, invented pedestrian bridge; Agra Fort lies outside this district |
| Hyderabad | One Old City district centred on Charminar, open four-way arches, four minarets, surrounding bazaars and actual nearby monuments | Duplicate Charminar, giant central dome, ocean/island composition |
| Lisbon | Belém–Alcântara and Almada across the Tagus; north-bank monuments, hills, tiled roofs and red suspension bridge | Unrelated central-Lisbon landmarks moved into Belém |
| Moon Base | Explicitly fictional engineered habitat, craters, landing pads and vehicles | Claims of an existing inhabited lunar settlement |

Bengaluru, Agra and Lisbon have parallel builders; the Agra builder continues with Hyderabad after its first checks. A dedicated review lead owns the independent visual review. The primary agent owns integration, shared terrain behavior, city loading, cross-chapter tests and release.

## Loading and performance contract

- The small location registry contains labels and URLs only. Each plan and world constructor is an explicit dynamic import selected by the current URL.
- Shared modules use type-only imports for chapter contracts. No new chapter imports another city's plan, architecture or assets.
- London asset-pack loading is invoked only for London. The Dubai lettering/font request is invoked only for Dubai. Dry worlds skip river reflections; the lunar bonus skips Earth's Moon textures and sky object.
- Switching locations navigates to a fresh document. A page-hide teardown disposes the old renderer, geometry, materials, texture resources and animation loop, including when the browser keeps the document in history; a restored history page reloads its selected chapter; only the selected chapter is constructed. Browser module caching may retain previously downloaded bytes, but does not instantiate inactive worlds.
- Initial geometry targets: fewer than 1,500 meshes and 650,000 unique triangles per new chapter, with the shared 12-local-light pool. Measured draw calls and frame timings remain the decisive performance check.
- Hills and decks share one height field for walking, click picking, trees, traffic signals, tool aiming and flight clearance.

## Primary references

- Bengaluru: [Bengaluru Urban district tourism](https://bengaluruurban.nic.in/en/tourism/), [Incredible India](https://www.incredibleindia.gov.in/en/karnataka/bengaluru), [KSTDC city map](https://kstdc.co/wp-content/uploads/2024/09/Bengaluru_Pocket_Hi_Res_compressed.pdf).
- Agra: [Taj architecture](https://www.tajmahal.gov.in/architecture.aspx), [Taj exteriors](https://tajmahal.gov.in/the-taj-exteriors.aspx), [UNESCO Taj Mahal](https://whc.unesco.org/en/list/252/).
- Hyderabad: [Hyderabad district — Charminar](https://hyderabad.telangana.gov.in/tourist-place/charminar/), [Musi corridor map](https://musi.telangana.gov.in/Media/AC.pdf).
- Lisbon: [Visit Lisboa — 25 de Abril Bridge](https://www.visitlisboa.com/pt-pt/locais/ponte-25-de-abril), [Jerónimos and Belém Tower](https://mosteirojeronimos.torrebelem.gov.pt/en/visitar).

Photographs inform original procedural geometry; they are not copied into runtime textures. Detailed chapter notes and final audit results are recorded during review.
