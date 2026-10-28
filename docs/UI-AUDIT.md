# Interface validation — 28 October 2026

This records the release interface, replacing earlier development snapshots. Automated source checks, real WebGL captures and browser interaction checks have different scopes; none alone establishes complete accessibility conformance.

## Source checks

`npm run audit:ui` checks 16 opaque text/focus token pairs and 10 glass-panel pairs across day and night. Glass checks composite the surface over black and white channel extrema. All pass their required text or focus thresholds. There are 26 source-level HUD buttons with accessible names; visible-label/name matching, unique IDs and ARIA references pass. Sonner owns additional dynamically rendered notification controls.

| Pair | Day | Night |
| --- | ---: | ---: |
| Main text / surface | 9.31:1 | 10.78:1 |
| Muted text / surface | 5.44:1 | 7.28:1 |
| Muted text / subtle surface | 4.80:1 | 5.71:1 |
| Selected text / accent | 7.44:1 | 6.21:1 |
| Muted text / glass, worst-case bound | 4.64:1 | 5.85:1 |
| Focus / glass, worst-case bound | 4.66:1 | 7.11:1 |

## Input and motion coverage

Tests cover Explore destination picking, invalid destinations, live collision changes, focus scoping, input modality, simultaneous held touch contacts and release/blur behavior. Live reduced-motion preference changes affect ambient animation and travel. Flight has no landing effect or shake. First-paint tests execute the inline appearance bootstrap with stored preferences and unavailable storage.

Explore is the default tool, displayed simply as “Explore.” Grenade Gun retains `B` and “Space to fire”; Plant a Tree retains `T` and displays “Space to plant.” Bomb and tree actions require explicit mode selection. Keyboard shortcuts are scoped to the canvas/body; focused controls do not also move or fire. Help contains camera button alternatives to gestures. Keyboard focus gets a visible theme-aware outline; pointer input does not retain it. The toolbelt has three modes: Explore, Grenade Gun and Plant a Tree. Explore handles click/tap travel; the separate Teleport tab and shortcut are removed. Notifications avoid repetitive object-cleared messages and retain actionable graphics errors.

Follow uses the navigation compass icon; the camera toolbar contains Follow, City, Birdview and zoom controls. Grenade Gun and the compact Fire action use the same gun symbol. The minimap remains north-up, with a fixed N and a separate needle indicating the camera's viewing direction. Cardinal-heading and quarter-orbit tests verify its direction and zoom independence.

Clicking the visible Moon surface opens Moon Base; the surrounding halo is excluded from picking, and foreground terrain or buildings block the shortcut. The world tab remains the keyboard-accessible alternative. Moon navigation, direct links and remembered Moon selection all use “To the moon...” from the initial HTML loading screen onward. Texture uploads occur during loading, and the Moon keeps consistent depth/render ordering during its fade so the surface shading does not switch abruptly. Tests cover fade continuity, illumination progress, visible-surface picking and the loading-message precedence.

## Rendered review

The README's day, night, landmark and character screenshots come from a public HTTPS preview through the actual WebGL renderer. A clean browser context is used for capture and smoke verification. The browser script is `scripts/browser-smoke.mjs`; its release results and viewport coverage are recorded in [RELEASE.md](RELEASE.md).

The desktop shortcut strip intentionally scrolls horizontally when space is limited. The compact layout replaces it with directional movement and independent Run, Help and tool buttons. The brand contains both reference and GitHub links, and the minimap has its own padded container and north compass centered across its upper-right corner. The compass extends halfway outside each edge; compact layouts reserve clearance to keep it within the viewport. The loader follows the saved/system appearance before JavaScript initialization.

The 28 October local Chrome check exercised London and Moon Base at 1600 × 1000. Six real WebGL moonrise frames from 0.5–3.2 seconds retain the crater texture and shaded limb without the previous halo/depth switch. A 22.5° camera orbit moves the minimap needle by the same amount; N stays fixed. A halo-only click stays in London, while clicking the sphere from Grenade Gun mode shows the Moon loading message and navigates without a shot or flight. A gated initial module confirms the direct-link HTML loading message. These checks produced zero page errors; the local report and frames are under `artifacts/moon-ui/`.

## Boundaries

Full screen-reader use, voice control, real iOS/Safari touch gestures, physical Android devices, forced colors, browser zoom at 200%, and extended gameplay on low-end GPUs have not been certified. Simulated browser viewports and synthetic multi-pointer tests are not substitutes for those checks. The canvas describes controls but does not expose a full nonvisual representation of the city. Source contrast checks do not independently inspect every rendered icon, moving label or toast.
