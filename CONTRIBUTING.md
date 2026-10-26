# Contributing

Use Node.js 24, `npm ci`, and `npm run dev`. Keep changes focused and run `npm run check` before proposing a release. This runs tests, city geometry checks, interface source checks, TypeScript and Vite. GPU behavior still needs a browser review. Run `npm run check:browser -- https://YOUR-DEPLOYMENT.vercel.app --production` against a production build.

## Repository layout

- `src/`: the application, procedural world and simulations.
- `tests/`: geometry, gameplay, lighting, camera and input regression tests.
- `scripts/`: audits, asset preparation and reproducible media capture.
- `public/assets/`: locally served source-derived assets with provenance.
- `public/social/`: the share image and short video; never loaded by the game.
- `docs/`: engineering, world authoring, verification and screenshots.
- `artifacts/`: ignored temporary frames and reports.

Keep generated `dist/`, dependencies, raw asset caches, credentials and `.vercel/` out of commits. The asset preparation scripts use temporary storage for source downloads. Add attribution with every external asset; the project's MIT license does not replace an asset's license.

## Geometry changes

Update the shared street/river data before changing visual geometry. Preserve finite transforms, accessible landmark arrivals and bridge clearance. Tests should protect behavior or a meaningful spatial invariant. For appearance-only adjustments, inspect actual renders instead of writing tests that repeat color constants.

## Media capture

Capture runs against an explicitly enabled HTTPS preview. It uses a clean Playwright browser context and the installed Google Chrome, not a personal browser profile. The capture module is excluded from ordinary production builds.

```sh
vercel deploy --build-env VITE_CAPTURE=1
node scripts/capture-media.mjs https://YOUR-PREVIEW.vercel.app
```

Use `--stills-only` to refresh screenshots and icons without regenerating the loop frames. FFmpeg is needed to encode the 144 captured frames:

```sh
ffmpeg -y -framerate 24 -i artifacts/reveal-frames/%04d.jpg \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
  -movflags +faststart -an public/social/london-reveal.mp4

ffmpeg -y -framerate 24 -i artifacts/reveal-frames/%04d.jpg \
  -filter_complex '[0:v]fps=8,scale=400:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle' \
  -loop 0 docs/media/london-loop.gif
```

Review all outputs. The real character model supplies the head icons. Keep the social image at 1200×630 and video at 960×540. Social platforms may choose the static image instead of playing the OG video.

## Release

Run checks and `npm audit`, review the staged diff and ignored files, then commit and push `main`. GitHub Actions repeats validation; the linked Vercel project builds production. A manual release can use `vercel deploy --prod`. **Do not set `VITE_CAPTURE` in production.** Check the public domain, GitHub homepage link, theme loading, controls, icons and media after deployment. Never put deployment tokens in scripts or documentation.

Original contributions are distributed under the repository's MIT license. Retain copyright and license notices when redistributing substantial portions. See [NOTICE](NOTICE) for asset-specific obligations.
