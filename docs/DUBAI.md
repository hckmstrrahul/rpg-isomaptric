# Chapter 002 · Dubai waterfront

Dubai is an artistic marina island based on the supplied composition reference. Its pavilion names describe this miniature; they do not claim a surveyed map or exact replicas of named Dubai landmarks.

## Composition and architecture

The sheltered turquoise bay opens through a shipping channel beneath three bridges. A coastal road wraps the island; an open marina crescent follows the bay, and cross streets serve the skyline. The former parallel straight road beside the crescent was removed, so its overlapping strips cannot reappear through independent placement.

The rear skyline contains **27 towers**, mixing elliptical plans, setbacks, tapered walls, twisted façades, crown caps and a slender stepped spire. Floor bands, façade mullions, podium entrances, rooftop plant and red obstruction beacons hold up at closer views. Continuous UVs prevent every twist segment or spire tier from repeating an entire building's window texture.

Three larger waterfront silhouettes anchor the foreground:

- **Pearl Pavilion:** eight curved, closed ivory shells with modeled thickness, recessed seams, a central oculus and a glazed colonnade on stepped terraces.
- **Harbour Conservatory:** an elongated glass half-ellipsoid with transverse structural ribs, longitudinal mullions and soft interior emission.
- **Marina Arts Centre:** paired sail roofs above glazed pavilions, with repeated ribs and warm recessed edge lighting.

31 low-rise limestone residences form smaller neighbourhoods with framed windows, parapets and roof pergolas. The landscape contains **1,100 palms/broadleaf trees** and **1,800 shrubs**. Placement reserves roads, building footprints, coastlines and all eight arrival points. Marina piers, continuous railings, 151 street lights and boat wakes connect the buildings to their waterfront setting.

## Shared gameplay

The same explorer walks, runs, flies, teleports, bombs objects and plants trees. Dubai's shoreline and bridge functions serve every tool and the minimap. Palm destruction releases its own collision records and reusable instance slots. Shrubs remain low, traversable decoration.

Six directed routes carry **36 vehicles**, using right-hand lanes and eight signal junctions. **18 boats** circulate through the marina and surrounding sea. Tests sweep their bounds against the actual bridge geometry and simulate ten minutes of traffic with the player at the starting promenade.

## Night and optimization

Night uses the shared neutral-cool palette, warm occupied rooms, softly lit glazing, spread-out ground washes and rooftop beacons. The 12-light pool, one merged ground-wash mesh, 768×768 reflection capped at 20 Hz, instanced foliage and shared material batches remain bounded. No new downloaded model or texture pack is required. Dubai skips London's optional bin/material pack, saving approximately 835 kB of chapter-specific asset requests.

A CPU geometry inventory on the completed scene measures **1,278 meshes and 449,219 unique triangles**, compared with London's **1,629 meshes and 819,256 unique triangles**. This inventory counts shared geometry once per mesh, not once per instance or render pass; it is not an FPS claim. Reflections, shadows, instances and postprocessing add GPU work. The test budgets leave headroom while staying below the measured London baseline.

Both scene constructors are lazy-loaded. Switching locations rebuilds one world rather than retaining two scenes, and cached shared assets can be reused. Theme and selected chapter persist; sandbox mutations and discoveries currently reset on navigation.

## Validation

`tests/dubai.test.ts` constructs the real scene and verifies shared spatial queries, unobstructed building/road footprints, static route clearance, finite geometry, foliage/light budgets, boat/bridge clearance, sustained traffic, palm slot reuse and walking connectivity to all eight destinations. `tests/world-location.test.ts` covers supported IDs and shareable URLs. Browser checks cover the real renderer and controls separately.
