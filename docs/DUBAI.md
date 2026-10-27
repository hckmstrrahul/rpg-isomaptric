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
- **Museum of the Future:** an enlarged asymmetric oval torus with a real open void, a planted mound and embedded entrance. A reflective physical silver material adds panel seams, shallow calligraphic recesses and softly illuminated lettering at night. The old floating paired sail roofs are removed.

The museum uses a 24-word selection from the published Arabic inscriptions, set in the self-hosted Aref Ruqaa typeface and wrapped across the shell. This is an artistic interpretation of the facade's lettering, not a reproduction of Mattar bin Lahej's bespoke calligraphy. The font's copyright and SIL Open Font License ship with the project.

**27 limestone residences**, **1,100 palms/broadleaf trees**, **1,800 shrubs** and **149 street lamps** fill the neighbourhoods. Placement reserves buildings, roads, coastlines and all nine arrival points.

## Harbour and shared gameplay

Five piers connect to the promenade with landings, sloped gangways, handrails and openings in the bank railing. Narrow finger pontoons, bollards and mooring lines serve **20 moored yachts**. The boats have pointed hulls, teak decks, glazing, flybridges, sun pads and navigation lights; moored sailing yachts carry furled canvas. They bob gently in place without emitting travelling wakes.

**18 moving boats** include twelve motor yachts and six sailing yachts with masts, rigging and billowing mainsails/jibs. Sailboats remain within the open bay; motor boats circulate through the channel and outer sea. Their routes clear the berths, piers and all three bridge decks.

The same explorer walks, runs, flies, teleports, bombs objects and plants trees. Shoreline and bridge functions serve all tools and the minimap. Boats remain destructible; destroyed palms release their collision records and reusable instance slots. Shrubs are traversable decoration. Six directed routes carry **36 vehicles** with right-hand lanes and eight signal junctions.

## Night and optimization

Night retains the shared neutral-cool palette, warm occupied rooms, soft glass emission, spread-out ground washes and rooftop beacons. Museum lettering, hotel accents, yacht navigation lights and dock bollards join the existing light system.

The **12-light pool**, one merged ground-wash mesh, **768×768 reflection capped at 20 Hz**, instanced foliage and material batches remain bounded. No downloaded model or texture pack is needed. Dubai loads one 111 kB local Arabic font and skips London's approximately 835 kB optional bin/material pack.

The completed scene measures **1,387 meshes and 506,515 unique triangles**, against London's **1,629 meshes and 819,256 unique triangles**. This CPU inventory counts geometry per mesh, excluding multiplied instances and render passes; it is not an FPS claim. The regression budgets remain below 1,500 meshes and 650,000 triangles.

Only one chapter scene is constructed at a time. Theme and location persist; sandbox mutations and discoveries currently reset when switching worlds.

## Validation and reproduction

`tests/dubai.test.ts` constructs the scene and checks named landmark presence, Burj height hierarchy, the museum's open void and grounded base, concentric shoreline geometry, continuous walkable paths, road miters and bridge elevations, building clearance, finite geometry, light/foliage budgets, moored-boat stability, shipping clearance, ten minutes of traffic, palm slot reuse and walking routes to every destination.

`node scripts/capture-dubai.mjs HTTPS_CAPTURE_PREVIEW` recreates the eight documentation images from a preview built with `VITE_CAPTURE=1`. Production omits the writable capture API.

## Architectural references

- [SOM: Burj Khalifa](https://www.som.com/projects/burj-khalifa/) — three-wing plan, setbacks and spire.
- [SOM: Cayan Tower](https://www.som.com/projects/cayan-tower/) — the 90-degree twisting tower.
- [Killa Design: Museum of the Future](https://www.killadesign.com/portfolio/museum-of-the-future/) — torus, void, green mound and calligraphic glazing; its project photography also provides the adjacent Emirates Towers reference.
- [Museum of the Future: building and inscriptions](https://museumofthefuture.ae/en/get-help) — the Arabic source excerpts and facade description.
- [Multiplex: Index](https://www.multiplex.global/projects/index/) — the slab and exposed structural form.
- [Jumeirah: The Story of an Icon](https://www.jumeirah.com/en/article/stories/dubai/the-story-of-an-icon) — Burj Al Arab's sail identity, height and helipad.
- [Aref Ruqaa source](https://github.com/google/fonts/tree/main/ofl/arefruqaa) and [bundled license](../public/licenses/aref-ruqaa-OFL.txt).
