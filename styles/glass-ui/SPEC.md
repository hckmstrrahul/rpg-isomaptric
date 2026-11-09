# Smoked Glass — UI specification

Version 1.0 · extracted from rpg isomaptric · CSS / HTML / optional JavaScript

[Live specimen](spec.html) · [Installation](README.md) · [Tokens](tokens.css)

## Material

A softly blurred, translucent surface over a detailed scene. A thin white edge and faint upper highlight define its shape; two diffuse shadows lift it from the background. Controls stay compact and rounded, with off-white text and outline icons.

**Light** means daylight surroundings, with warm green smoke. **Dark** means night surroundings, with cool blue smoke. Both surfaces remain dark enough for light text. The bluish tint belongs to the dark variant; the light variant is green. The background can tint either through transparency.

`tokens.css` is the source of truth. The web app imports `glass.css`; its layout remains in `styles/app.css`. This folder has no dependency on the app, Three.js, React, or a utility framework.

## Color tokens

Every token has the `--glass-` prefix. Eight-digit colors are `#RRGGBBAA`.

| Token suffix | Light | Dark | Use |
| --- | --- | --- | --- |
| `color` | `#18261dc2` | `#16232bc2` | Translucent backing, 76.1% opacity. |
| `surface` | `#26342b` | `#202d34` | Opaque fallback and elevated content. |
| `subtle` | `#39483c` | `#35454d` | Secondary solid surface. |
| `ink` | `#f5f7ef` | `#f0f5f4` | Main text and icons. |
| `muted` | `#d3dbcf` | `#d0dadb` | Supporting text. |
| `accent` | `#465d49` | `#435b61` | Solid primary action. |
| `on-accent` | `#f8faf3` | `#f2f7f6` | Text on accent or selected controls. |
| `edge`, `line` | `#ffffff24` | Same | 14.1% white boundary. |
| `hover` | `#ffffff12` | Same | 7.1% white hover fill. |
| `selected` | `#ffffff24` | Same | 14.1% white selected fill. |
| `key-surface` | `#ffffff0d` | Same | 5.1% white keycap fill. |
| `focus` | `#c4e4f5` | Same | Visible keyboard outline. |
| `success` | `#d0ebc5` | Same | Success text; accompany with meaning. |
| `danger` | `#ffd0c3` | Same | Error text; accompany with meaning. |

The source contrast audit calculates a lower bound over pure black and white backdrops: light main/muted text **6.66:1 / 5.07:1**, dark **6.62:1 / 5.11:1**, before the very faint sheen. These are token checks, not an accessibility certification. Recheck contrast after changing opacity, color, overlays, or type size.

## Surface recipe

```css
.glass {
  background: var(--glass-sheen), var(--glass-color);
  backdrop-filter: blur(28px) saturate(125%);
  -webkit-backdrop-filter: blur(28px) saturate(125%);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--glass-shadow);
}
```

| Layer | Value |
| --- | --- |
| Sheen | `linear-gradient(145deg, #ffffff05, transparent 60%)` |
| Inner highlight | `inset 0 1px 0 #ffffff0c` |
| Light near / far shadows | `0 4px 12px #0b170f12` / `0 16px 40px #0b170f24` |
| Dark near / far shadows | `0 4px 12px #0000001a` / `0 16px 40px #00000033` |
| Unsupported blur / reduced transparency | Opaque `--glass-surface`. |
| Forced colors | System canvas, text, highlight and visible borders. |

Keep the surface's own opacity at `1`. Alpha belongs in the background color, so children remain legible. Keep glass containers as siblings where possible; nested backdrop filters can change what each layer samples. Use a translucent selected fill inside a glass surface instead of adding another blur layer.

## Geometry and spacing

| Element | Exact dimensions |
| --- | --- |
| Control target | Minimum `44 × 44px`. |
| Icon | `18 × 18px`, outline, `currentColor`; match stroke to nearby text. |
| Vertical toolbar | `54px` wide; `4px` inset; `1px` border; `2px` internal gap. |
| Toolbar radius | `27px`, with `22px` inner circular buttons. |
| Separate groups | `6px` edge-to-edge, including the help circle. |
| Floating help | `54 × 54px`, circular. |
| General panel | `24px` radius, `24px` internal padding. |
| Title → subtext | `8px`. |
| Tooltip | `10px` radius; `7px 10px` padding; `10px` from trigger, clamped `8px` from viewport. |
| Image/map frame | Outer radius `24px`, padding `6px`, border `1px`, inner radius `17px`. |
| Frame caption | `12px 10px 10px`, left aligned. |
| Keycap | Minimum `23 × 23px`, `3px 6px` padding, `6px` radius, `1px` line. |

Concentric rule: **inner radius = outer radius − padding − border**. The toolbar follows `27 − 4 − 1 = 22`; the image frame follows `24 − 6 − 1 = 17`. A caption has asymmetric padding, so only the shared top corners are concentric.

## Typography

Inter variable is included locally. Use system sans-serif as fallback. These sizes preserve the original dense game HUD at a `16px` root size; reading-heavy interfaces should override body and detail tokens to larger sizes.

| Role | Token / app value | Weight | Line height |
| --- | --- | --- | --- |
| Panel title | `--glass-text-title: 1.375rem` (22px) | 600 | 1.2 |
| Button label | `--glass-text-label: .75rem` (12px) | 600 | 1.35 |
| Help intro, row, tooltip | `--glass-text-body: .6875rem` (11px) | 400–500 | 1.4–1.5 |
| Caption, keycap | `--glass-text-caption: .625rem` (10px) | 500–550 | 1.25–1.4 |
| Tool description | `--glass-text-detail: .5625rem` (9px) | 450 | 1.4 |
| App brand title | 23px | 600 | 1.05, tracking −.035em |
| App brand subtitle | 14px | 450 | 1.4 |

For a less dense interface:

```css
.my-interface {
  --glass-text-body: .875rem;
  --glass-text-detail: .75rem;
  --glass-text-caption: .75rem;
  --glass-text-label: .875rem;
}
```

## Component contracts

Use `.glass` for the material, then compose with the component class. The stylesheet never positions your page or resets `body`.

| Classes | Behavior / application responsibility |
| --- | --- |
| `.glass.glass-panel` | Padded card; use a semantic section and heading. |
| `.glass-toolbar`, `--vertical` modifier | Button group; name it with `aria-label`. Use `nav` only for navigation. |
| `.glass-button`, `--icon`, `--floating` | Native buttons or links. Give icon-only controls an accessible name. |
| `[aria-pressed=true]`, `[aria-selected=true]`, `.is-active` | Selected fill and inset ring. Prefer the ARIA state that matches the interaction. |
| `.glass-title`, `.glass-description`, `.glass-row` | Shared hierarchy and spacing. |
| `.glass-kbd` | Displayed keyboard shortcut; not an interactive button. |
| `.glass-frame`, `.glass-frame__media`, `.glass-frame__caption` | Correctly nested media and caption. |
| `.glass-scroll` + `observeGlassScroll()` | Overflow indicator that disappears at the bottom. Set a bounded height yourself. |
| `data-tooltip` + `installGlassTooltips()` | Noninteractive text tooltip outside clipped containers. |

### Independent icon groups

```html
<div class="glass-stack" data-tooltip-side="right">
  <div class="glass glass-toolbar glass-toolbar--vertical" role="group" aria-label="Zoom">
    <button class="glass-button glass-button--icon" aria-label="Zoom in" data-tooltip="Zoom in (+)">+</button>
    <button class="glass-button glass-button--icon" aria-label="Zoom out" data-tooltip="Zoom out (−)">−</button>
  </div>
  <button class="glass glass-button glass-button--icon glass-button--floating"
    aria-label="Help" aria-expanded="false" aria-controls="my-help" data-tooltip="Help">?</button>
</div>
```

Supply the referenced help panel and disclosure behavior. Keep help in the same place; swap its icon to a cross and update its accessible name and `aria-expanded` while open. Use `hidden` or `inert` to keep closed content out of the focus order. This CSS does not implement a dialog's focus trap or menu keyboard pattern.

### Scroll indicator

```html
<section class="glass glass-panel">
  <div class="glass-scroll" style="max-height:320px" tabindex="0" aria-label="Controls">
    <div><!-- your complete content --></div>
  </div>
</section>
```

```js
import {observeGlassScroll} from './glass-ui/behaviors.js';
const cleanup = observeGlassScroll(document.querySelector('.glass-scroll'));
```

The bottom `96px` fades through a 60% mask stop `44px` from the end, becoming transparent `8px` from the end. The helper removes the mask within `2px` of the bottom. It watches scrolling and content resizing. The mask must not permanently conceal the final row.

## Interaction and motion

| Event | Result |
| --- | --- |
| Hover | White overlay, only on hover-capable pointers. |
| Press | Scale `.96`, `150ms ease-out`, only if enabled and motion is allowed. |
| Selected | Persistent fill + inset ring + semantic ARIA state. |
| Keyboard focus | `2px` focus outline, offset `2px`. Do not hide it globally. |
| Tooltip hover / departure | Show after `350ms`; allow `120ms` to move into the tooltip. |
| Tooltip keyboard focus | Immediate; `Escape` dismisses before the parent overlay. |
| Theme swap | Suppress transitions through a style flush and two animation frames. |
| Reduced motion | No scale or movement transitions. State remains visible. |
| Disabled | 50% opacity, no hover or press animation. Native `disabled` blocks activation. |

The tooltip helper preserves existing `aria-describedby`, converts native button/link `title` text, follows the nearest theme wrapper, ignores touch hover, and cleans up listeners on disposal. Use `aria-label` for the control's name; the tooltip is supporting text. If using `aria-disabled` on an anchor, your application must block activation.

## Portability

Copy the entire `glass-ui/` folder; include `glass.css`; choose a theme. Optional helpers are ES modules with TypeScript declarations. Keep the relative paths together. Set the theme before the first paint when restoring a saved preference. The helpers do not store preferences or change your page's `color-scheme`.

The included preview pictures are original procedural Bengaluru screenshots. They are not needed by the CSS. The local Latin Inter font retains its SIL Open Font License in `assets/OFL.txt`; the theme, source and spec retain the included MIT license.
