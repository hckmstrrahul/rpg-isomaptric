# Moon, visitors and compact Lisbon review

Independent renderer review, 28 October 2026. This follows the completed earlier pass in [night-refinement-review.md](night-refinement-review.md).

## Status

**The latest refinement pass passes the scoped visual review.** Agra's visitor and Moon-linked marble treatment, Lisbon's compact neighborhoods and repaired curbs, and the UI/Moon changes have been reviewed. Recordings have not started at this review gate: the requested fixes, documentation and commit/push come first.

## Method and evidence

The reviewer captured the actual Three.js game renderer in Chrome at 1600×1000, DPR 1, using a separate local capture server on port 5189. Review-only state access was injected into the browser response, without adding production debug controls. The scripts and PNG/JSON evidence are ignored local artifacts in `artifacts/latest-visual-review/`. The UI agent's independent interaction report and Moon-rise captures are in `artifacts/moon-ui/`.

Images were opened and inspected manually. The crowd lifecycle was advanced with the same production update functions in 0.05-second simulation steps, with traffic and Moon updates included; these are deterministic state captures, not a wall-clock recording or a claim that screenshots alone prove every motion path.

## Corrections requested during this review

1. The first Agra crowd repeated equally spaced four-person lines in every viewing area. At dawn, visitors from different routes sharing a home overlapped at doorways. The agent changed this to irregular groups of two to six, individual viewing stations, per-home departure queues, and same-lane following in both directions. Fresh day and dawn captures show varied groups and separated doorway departures.
2. Lisbon's first curved turning aprons kept wheels on asphalt but introduced triangular grass slits, detached white curb spikes and abrupt pavement ends where old and new borders subtracted each other. The top-down and oblique corner views exposed this despite the road-surface tests passing. Correcting the border subtraction and tapering the apron widths produces a continuous pavement edge in the fresh corner and waterfront captures; the visible slits, spikes and abrupt ends are gone.

## Agra findings

- The Taj's marble visibly brightens as the Moon rises, with a restrained pale rim around the dome and minarets. Dark arch recesses remain legible; the surface does not become a flat white bloom. The matched daytime frame retains normal opaque white stone.
- The Moon-linked aura rises continuously: its strength is approximately 0.005, 0.343, 0.696, 0.897, 0.985 and 0.999 at 0.5, 0.8, 1.1, 1.5, 2.2 and 3.2 simulated seconds. The images, rather than these values alone, establish that the stronger effect is visible.
- The 72 visitors populate the forecourt, garden paths and terrace in small groups. At dusk, the captured route sequence leads through the Great Gate and marked crossing to seven actual houses. All 72 are indoors by the 280-second sample. The later 350-second sample remains empty.
- At dawn, the number still indoors decreases from 72 to 69, 60, 41, 22, 4 and 0 at 1, 3, 6, 10, 15 and 25 seconds. The inspected closeups show figures emerging at the house doors and walking along the rear lane, with the previous overlapping doorway clumps removed.
- A separate saved-night load starts with all 72 visitors indoors before each of the first three rendered frames. The matched night garden is empty. After a subsequent 350-second dawn advance, the manually inspected garden shows visitors back at their separate viewing areas, without a stranded queue behind the resting groups. The final one-second capture update leaves everyone within approximately 1.03 units of their viewing station, including their short idle strolls.
- Wooden riverboats now carry two seated people with oars. The close day/night pair shows their bodies supported by the boat seats, with the forward bench left free for the warm night lantern. Reflections and the hull's placement remain intact.
- The revised Agra day/night README images were captured from this source and manually checked. The night image uses a completed visitor return-home cycle.

## Lisbon findings

- The new housing reads as a denser series of attached streets, with short rows, varied building heights and richer terracotta/rust roofs. Open landmark forecourts and the wooded Pena inset remain recognizable.
- The low oblique district view shows gentle residential rises and falls; the engineered Pena road and bridge approaches retain their protected grades.
- MAAT and Central Tejo follow the local riverbank direction. The top-down and oblique views show a continuous clear promenade in front of them.
- The Pena roadside retaining line has a grounded capped termination before the separate stair bed. The previous raised hook beside the lower steps is absent. The tread and landing surfaces remain supported in the inspected closeups.
- The parish-church study keeps a legible white pediment, bell tower and pitched roof among the denser houses. It is an architectural study within the compressed district, not a relocated named landmark.
- Night views retain readable roads and building shapes, with warm local street and waterfront accents. Selected boat cabins illuminate while other vessels remain dark.
- The corrected narrow roads have continuous asphalt and curb outlines through the inspected curved corners and waterfront junctions. The final source retains 822 dwellings; its agent-reported geometry budget is 649,559 unique triangles and 1,403 meshes, under the existing caps. Full-scene performance remains part of the root's integration checks.
- The final Lisbon day/night README gallery was refreshed from this corrected source.

## UI and Moon evidence

The reviewer manually compared Moon-rise PNGs at 0.5 and 3.2 seconds and inspected the first-paint loading image. Crater texture and the shaded limb are already present in the early frame and remain consistent later. The loading screen reads “To the moon...”. The updated visible controls omit Reset, use its compass icon for Follow, and show a gun icon for Grenade Gun.

The UI agent's Chrome report records a 22.5-degree scene orbit with a matching camera-needle rotation while north remains fixed; a halo-only click stays in the current world; clicking the actual Moon from Gun mode opens Moon Base without firing or launching a flight. It also verifies the special loading copy before the main module executes. These interaction checks were performed by the UI agent and reviewed here, rather than independently repeated by this reviewer.

## Limits

The audit covers the captured viewpoints and the scripted lifecycle, not every possible player action or angle. The worlds remain compressed playable miniatures. Performance, full-suite validation and selected-world-only loading checks belong to the root's final integration gate. No production source was edited by this reviewer.
