# Interface styles

- **[`glass-ui/`](glass-ui/)** is the self-contained theme to copy into another project. It includes the light/dark palette, reusable components, optional helpers, local font, visual spec and licenses.
- **[`app.css`](app.css)** imports that kit and adds this game's HUD layout, minimap, touch controls and responsive rules. It belongs to rpg isomaptric and is not needed by other projects.
- **[`loading.css`](loading.css)** is inlined into the HTML by Vite so the same loading surface appears before JavaScript starts and during city changes.

Open [`glass-ui/spec.html`](glass-ui/spec.html) through the development server for the visual reference. Read [`glass-ui/SPEC.md`](glass-ui/SPEC.md) for exact values and [`glass-ui/README.md`](glass-ui/README.md) for setup.
