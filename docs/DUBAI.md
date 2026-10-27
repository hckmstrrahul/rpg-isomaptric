# Chapter 002 · Dubai waterfront

Dubai combines the supplied marina-island composition with recognizable Dubai architecture. The miniature compresses distances and building scale; it is an artistic world, not a surveyed map or an exact architectural replica.

## Composition and architecture

The circular harbour, continuous promenade and curved road share a centre and fixed radii. The bay opens into a shipping channel beneath three bridges. A coastal boulevard wraps the island, with cross streets serving the skyline. Mitered road joins and butt ends remove protruding junction anchors. Bridge asphalt widens gradually along sampled ramps instead of overlapping a second rectangular road patch. Trees, palms, shrubs and lamps reserve the full promenade width.

The **28-tower skyline** includes five named towers with distinct procedural geometry:

- **Burj Khalifa:** three rounded wings, 18 staggered setback tiers, closely spaced floor bands and a telescoping spire. At 108 scene units, it remains clearly taller than the surrounding skyline. The City camera includes the full spire.
- **Cayan Tower:** a complete 90-degree twist, continuous glazing, rotating floor plates and vertical ribs above a grounded lobby.
- **Emirates Office Tower and Jumeirah Emirates Tower:** triangular plans, diagonal silver crowns and aerials at two heights.
- **Index Tower:** a broad slab with exposed pale buttresses, recessed glass and a sky-lobby band.

**Burj Al Arab** stands on the western coastal strip. Its curved sail profile, blue glazing, white exoskeleton, mast, bracket-supported helipad and rear restaurant cantilever distinguish it from the rectangular skyline. The nine discoverable destinations include both Burj landmarks.

Three sculptural buildings anchor the waterfront:

- **Pearl Pavilion:** eight closed ivory petal shells with thickness, seams, a central oculus and a glazed colonnade on stepped terraces.
- **Harbour Conservatory:** an elongated glass half-ellipsoid with structural ribs, longitudinal mullions and soft interior emission.
- **Museum of the Future:** an asymmetric, 28.4-unit-wide shell with a broad left shoulder, a thinner right return and a lower, right-offset open void. The silhouette is approximately 13% wider and 14% taller than the previous model, with more depth on the left and a grounded planted mound. A reflective physical silver material adds panel seams, shallow calligraphic recesses and softly illuminated lettering at night. The old floating paired sail roofs are removed.

The museum uses a 24-word selection from the published Arabic inscriptions, set in the self-hosted Aref Ruqaa typeface. Twelve dense courses use elevation UVs to stay upright across the front and rear, rather than rotating around the tube. A single 128 × 32 parametric surface carries the shell; its rotation is baked into vertices so collision bounds match the actual footprint. This is an artistic interpretation of the facade's lettering, not a reproduction of Mattar bin Lahej's bespoke calligraphy. The font's copyright and SIL Open Font License ship with the project.

**27 limestone residences**, **1,100 palms/broadleaf trees**, **1,800 shrubs** and **147 street lamps** fill the neighbourhoods. Placement reserves buildings, roads, coastlines and all nine arrival points.

## Harbour and shared gameplay

Five piers connect to the promenade with landings, sloped gangways, handrails and openings in the bank railing. Narrow finger pontoons, bollards and mooring lines serve **20 moored yachts**. The boats have pointed hulls, teak decks, glazing, flybridges, sun pads and navigation lights; moored sailing yachts carry furled canvas. They bob gently in place without emitting travelling wakes.

**18 moving boats** include twelve motor yachts and six sailing yachts with masts, rigging and billowing mainsails/jibs. Sailboats remain within the open bay; motor boats circulate through the channel and outer sea. Their routes clear the berths, piers and all three bridge decks.

The same explorer walks, runs, flies, bombs objects and plants trees. Shoreline and bridge functions serve all tools and the minimap. Boats remain destructible; destroyed palms release their collision records and reusable instance slots. Shrubs are traversable decoration. Six directed routes carry **36 vehicles** with right-hand lanes and eight signal junctions.

## Night and optimization

Seven cached facade finishes distinguish silver vertical fins, blue curtain walls, teal ribbons, bronze screens, pale horizontal sunshades, punched stone windows and dark slate glass. Smooth office towers omit the repeated exterior floor ledges. Burj Khalifa uses silver glazing; Cayan uses pale shading; the Emirates pair uses blue glass; Index uses dark recessed glass between concrete buttresses. These are compressed architectural interpretations of the referenced buildings, not measured replicas.

Night retains the shared neutral-cool palette. Cooler office suites, warm apartments and amber hotel rooms have different occupancies, dark floors and restrained brightness. The built skyline uses 17 profiles and 24 unique 256 × 512 facade maps, shared across buildings; the maximum is three night patterns per finish. Night emission stays between 0.40 and 0.58. No window meshes, new dynamic lights or per-frame texture updates are added. Rooftop beacon rods start at the actual crown or roof equipment, including the offset Emirates aerials. Museum lettering, hotel accents, yacht navigation lights and dock bollards join the existing light system.

The **12-light pool**, one merged ground-wash mesh, **768×768 reflection capped at 20 Hz**, instanced foliage and material batches remain bounded. No downloaded model or texture pack is needed. Dubai loads one 111 kB local Arabic font and skips London's approximately 835 kB optional bin/material pack.

Removing redundant floor trim reduces the previous 506,515-triangle inventory by approximately 2.6%. The completed scene measures **1,394 meshes and 493,547 unique triangles**, against London's **1,629 meshes and 819,256 unique triangles**. This CPU inventory counts geometry per mesh, excluding multiplied instances and render passes; it is not an FPS claim. The regression budgets remain below 1,500 meshes and 650,000 triangles.

Only one chapter scene is constructed at a time. Theme and location persist; sandbox mutations and discoveries currently reset when switching worlds.

## Validation and reproduction

`tests/dubai.test.ts` constructs the scene and checks named landmark presence, Burj height hierarchy, the museum's open void and grounded base, concentric shoreline geometry, continuous walkable paths, road miters and bridge elevations, building clearance, finite geometry, facade variety and texture/emission budgets, light/foliage budgets, moored-boat stability, shipping clearance, ten minutes of traffic, palm slot reuse and walking routes to every destination.

`node scripts/capture-dubai.mjs HTTPS_CAPTURE_PREVIEW` recreates the eight documentation images from a preview built with `VITE_CAPTURE=1`. Production omits the writable capture API.

## Architectural references

- [SOM: Burj Khalifa](https://www.som.com/projects/burj-khalifa/) — three-wing plan, setbacks and spire.
- [SOM: Cayan Tower](https://www.som.com/projects/cayan-tower/) — the 90-degree twisting tower.
- [Killa Design: Museum of the Future](https://www.killadesign.com/portfolio/museum-of-the-future/) — torus, void, green mound and calligraphic glazing; its project photography also provides the adjacent Emirates Towers reference.
- [Museum of the Future: building and inscriptions](https://museumofthefuture.ae/en/get-help) — the Arabic source excerpts and facade description.
- [Multiplex: Index](https://www.multiplex.global/projects/index/) — the slab and exposed structural form.
- [Jumeirah: The Story of an Icon](https://www.jumeirah.com/en/article/stories/dubai/the-story-of-an-icon) — Burj Al Arab's sail identity, height and helipad.
- [Speirs Major: Burj Al Arab lighting](https://www.speirsandmajor.com/projects/506/burj-al-arab) — restrained landscape illumination and white structural accents inform the night palette; the miniature does not reproduce its animated facade shows.
- [Aref Ruqaa source](https://github.com/google/fonts/tree/main/ofl/arefruqaa) and [bundled license](../public/licenses/aref-ruqaa-OFL.txt).
