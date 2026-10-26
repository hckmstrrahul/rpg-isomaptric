# Building the next world

London is Chapter 001 of **rpg isomaptric**. The project is intended to grow into a series of location-inspired RPG worlds, but it currently has one composition and one entry point. There is no implemented world selector, downloadable world format or plug-in loader yet.

## Start with a coherent composition

Choose a small set of recognizable landmarks, the street hierarchy, a natural boundary such as a river, and a readable starting location. Treat the result as a playable miniature, not a map reconstruction. Establish the X/Z footprint, ground and water heights, bridge clearances and landmark arrival points before adding decorative detail.

Use the London data in `layout.ts`, `cityPlan.ts` and `boundary.ts` as the reference. Streets, collision, traffic and the map must derive from one shared plan. Do not independently redraw a convincing road in the visual layer while leaving the navigation layer unchanged.

## Extract shared systems as needed

A useful next step is a typed world definition for identity, bounds, road segments, landmark/arrival data, river or terrain functions, theme palette and an assembly callback. This is a proposed boundary, not an API that exists today. Keep the explorer, input, camera curves, sandbox state, notifications, renderer and material utilities shared. Move London geometry and layout into a location-specific module only when a second world establishes the real differences.

## Acceptance checklist

1. Put the explorer on open ground, centered in the arrival camera. Reach every landmark on foot.
2. Reserve full street corners, pavement borders and furniture footprints. Use the city audit rather than visual inspection alone.
3. Connect all road endpoints and bridge ramps. Sweep boat bounds against actual bridge triangles if the world includes shipping.
4. Register destructible roots and live collision updates. Cleared plots must support valid replanting and travel.
5. Plan traffic routes and junction conflicts together. Run sustained flow tests with the explorer standing in the busiest lane.
6. Give every bright local light a visible source. Use the bounded light pool and batched washes; keep destruction and night visibility linked.
7. Respect reduced motion and theme preference from the first loading frame. Check touch actions simultaneously and at narrow widths.
8. Keep assets local and record provenance, revision, processing and licenses. Preserve third-party attribution separately from original project licensing.
9. Capture real day/night, landmark and character media. Update title, canonical URL and social assets only when the new chapter is ready to publish.

Run `npm run check` after each structural stage. Add tests around the new world's invariants, not screenshots of incidental implementation details. Use [the engineering guide](ENGINEERING.md) to find current owners and [the contribution guide](../CONTRIBUTING.md) for reproducible capture and release commands.
