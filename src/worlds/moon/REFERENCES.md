# Moon Base — explicitly fictional bonus

The user approved a separate fictional Moon-base bonus world. This is an original designed outpost, not a reconstruction of a real space facility or a claim that such buildings exist. It takes composition cues from the supplied gray lunar miniature: a cratered slab, central rounded habitat/control tower, service corridors, solar arrays, observatory, antennas, landing craft, workshop and rovers. It contains no imported photographs, map data, external meshes, NASA marks or mission claims.

The eight visits all say “Fictional” in their descriptions. Chapter metadata and help label the location as a fictional bonus. The explorer and sandbox are shared. Trees are planted only inside small sealed, instanced greenhouse enclosures with matching planting previews; no exposed grass or terrestrial forest covers the regolith.

The terrain and shared walking/teleport heights use the same `lunarHeight` function. A 192×192 terrain grid describes the crater bowls and rims; service corridors, pressure structures and landing pads flatten the same surface. This is designed game terrain rather than a scientific lunar elevation model. The slab edge follows the heightfield and extends below its deepest bowl.

The chapter disables terrestrial water/reflections and the separate sky Moon. Gray terrain uses two small 256×256 procedural maps, rock fragments share an instance batch, pressure vessels and their architectural detail are merged per destructible object, and planted greenhouse canopies use a single modest-opacity instanced material. Only eight local light sources compete for the existing twelve light slots; light washes form one batch. Day/night are artistic illumination modes, not a simulation of lunar astronomical time.

The review refinement deepens visible crater relief, shades bowls and raised rims with vertex colors, replaces periodic plaid noise with irregular multi-scale grain, and closes outward-facing cutaway walls down to an 18-unit base. The central pressure habitat is enlarged within its service loop; non-overlapping wall/glazing bands and batched panel seams remove unstable corner surfaces.

The final habitat pass adds upper-deck panel seams, three grouped radiator/service units with support bases, connected conduits, an access hatch and a projecting framed pressure airlock. These details reuse existing merged material batches and add no lights; the complete chapter remains at 88 meshes and 121,842 unique triangles before instance copies.
