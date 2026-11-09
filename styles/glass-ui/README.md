# Smoked Glass

A portable light/dark glass theme extracted from **rpg isomaptric**. Copy this whole folder into another project. It includes its fonts, preview images, source, and licenses; no npm dependency or build step is required for the CSS.

[Visual spec](spec.html) · [Written specification](SPEC.md) · [CSS entry point](glass.css)

## Use it

```html
<link rel="stylesheet" href="./glass-ui/glass.css">

<section data-glass-theme="light">
  <div class="glass glass-panel">
    <h2 class="glass-title">A changing sky</h2>
    <p class="glass-description">Choose the atmosphere for your world.</p>
    <button class="glass-button" aria-pressed="true">Daytime</button>
    <button class="glass-button" aria-pressed="false">Nightfall</button>
  </div>
</section>
```

Set `data-glass-theme="light"` or `"dark"` on `<html>` or a local wrapper. Both use light text on smoked glass: light is warm green, dark is cool blue. The surrounding content supplies the color and blur. Add your own page background and layout.

For Vite or another CSS-aware bundler:

```js
import './glass-ui/glass.css';
import {setGlassTheme, installGlassTooltips, observeGlassScroll} from './glass-ui/behaviors.js';

setGlassTheme('dark');
const removeTooltips = installGlassTooltips();
// Optional: const stopWatching = observeGlassScroll(scrollableElement);
// Call the returned functions when their view unmounts.
```

The CSS is enough for the visual theme. Optional JavaScript handles tooltips, scroll fading and theme transitions. Application state, menu disclosure, focus management and persistence remain yours.

## Files

| File | Purpose |
| --- | --- |
| `assets/` | Local Inter font, OFL license and original Bengaluru preview images. |
| `behaviors.js` / `behaviors.d.ts` | Optional framework-free helpers and TypeScript declarations. |
| `font.css` | Optional local font definition. |
| `glass.css` | Surfaces, buttons, rails, panels, keycaps, tooltips and frames. Imports tokens and font. |
| `tokens.css` | The light/dark palette, dimensions, type and motion values. |
| `spec.html` / `spec.css` / `spec.js` | Interactive visual specification. |
| `SPEC.md` | Recipes, component contracts and accessibility guidance. |
| `LICENSE` | MIT notice for this theme and its documentation. |

To view the interactive spec after copying, serve this folder and open the printed address with `/spec.html`:

```sh
python3 -m http.server 8000
```

The visual reference also opens directly as an HTML file; its optional module-based controls need an HTTP server.

Override `--glass-*` custom properties after importing the stylesheet. Remove the `font.css` import if you already supply a font. The preview JPEGs are only used by the spec and can be omitted from a production application. Keep the MIT notice, and the OFL notice if you distribute the font.
