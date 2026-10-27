# Building the next world

The six chapters are **London, Dubai, Bengaluru, Agra, Lisbon** and the fictional **Moon Base**. They share the renderer, explorer, input, camera, sandbox and effects. Their geometry and spatial plans differ. This is a small explicit location boundary, not a downloadable world format or general-purpose plug-in engine.

## Current extension points

- `worldLocation.ts` resolves a known `?world=` value, then the stored selection, then London. Add a new identity and display metadata here.
- `hud.ts` and `style.css` own the location pill. Links support ordinary navigation, shared URLs, keyboard focus and reduced motion. Selection reconstructs one scene through the themed loader, preserving appearance but resetting temporary world edits.
- `main.ts` dynamically imports the selected constructor. Only load assets the chapter needs. Return the common scene interface: objects, obstacles, water, update callbacks, lighting and landmarks.
- `worldPlan.ts` dynamically imports only the selected `worlds/<id>/plan.ts`. Implement the type-only `WorldPlan` contract in `worlds/types.ts`: absolute height field, dry ground, bridges, landmarks, minimap polygons, roads and camera. `layout.ts` dispatches terrain, water, bridge, arrival and landmark queries. `cityPlan.ts` supplies the selected road plan. These queries also feed planting, teleporting, collision and the minimap.
- `worlds/dubai/plan.ts`, `architecture.ts`, `landmarks.ts`, `marina.ts`, `surfaces.ts` and `world.ts` demonstrate a separate location. London's mature geometry remains in its existing modules; a wholesale move was unnecessary.

## Start with a coherent composition

Choose recognizable architectural silhouettes, street hierarchy, a natural boundary and an open starting location. Establish the X/Z footprint, ground/water heights, bridge clearance and arrival points before decorative detail. Keep a reference beside rendered overview and close-up views, including night views.

Rendering, collision, traffic and the map must derive from one plan. Use the existing three road widths (4.7, 4 and 3.2 metres) and 0.75-metre borders. Avoid independently drawn overlapping arterials: connect street endpoints to the actual sampled curve. Reserve full building footprints and tree crowns, including scaled and rotated models.

## Reuse the bounded systems

Traffic accepts route loops, junctions, lane direction and fleet size. `WorldObjects.registerTreeSpecies` adds reusable trunk/leaf instance banks while retaining live collision, wind and destruction. Vegetation decoration should be instanced; low groundcover may remain traversable. Use shared façade textures and material batches across buildings.

Visible bulbs and emission do not each need a real light. Register local sources for the 12-light pool and clip soft ground washes to actual ground/decks before combining them in `NightGroundGlows`. Transform clipping samples through model scale and rotation. Reuse the existing water reflection, wake history, projected targeting and reusable effects.

## Acceptance checklist

1. Start the explorer on open ground and connect every landmark arrival through the walking map.
2. Reserve street corners, pavement and furniture footprints; inspect both data and rendered junctions.
3. Keep road widths consistent and bridge ramps connected. Sweep actual boat bounds against bridge triangles.
4. Register destructible roots and collision updates. Test clearing, replanting and reusable instance slots.
5. Check route footprints against static obstacles and simulate sustained traffic with the player at the starting area. Exercise player avoidance through ordinary gameplay too.
6. Link destruction to emitted light and pooled local sources. Measure geometry counts and preserve the bounded lighting/reflection pipeline.
7. Check both theme loading states, location switching, gameplay, full-motion travel and small touch layouts.
8. Keep assets local and record provenance and licenses. Capture real day/night and architectural media.

Run `npm run check`, then browser checks against an HTTPS preview for **all chapters**. Add geometry-level tests for the new composition. See [Dubai notes](DUBAI.md), [engineering](ENGINEERING.md) and [contributing](../CONTRIBUTING.md) for ownership and release workflows.

## Geographic and loading boundaries

New terrestrial chapters must establish a coherent district with actual landmark relationships. Do not reproduce fictitious geography from generated references. Document the projection/crop, architectural exaggeration and any gameplay concessions. The lunar chapter is explicitly fictional.

Use `worlds/shared/surfaces.ts` for generic road strokes; never import another chapter for a helper. Type-only imports are safe for shared contracts. Chapter metadata belongs in `worldLocation.ts` without geometry or asset imports. Add both selected-plan and constructor loaders, and run `node scripts/audit-world-loading.mjs` after building. An HTTPS URL adds cold-browser network checks.

`heightAt` returns absolute surface elevation. Shared walking, trees, signals, aiming and flight clearance use this field. Dry districts set `waterVisible:false` to skip reflection allocation. Moon Base also sets `moonVisible:false` to skip the Earth-view lunar textures/object. All worlds retain the common runtime shape, including a hidden water mesh when unused.
