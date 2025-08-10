# Imagine — Pollinations Image Generator

A stylish, responsive React + Vite + Tailwind app to generate images using Pollinations’ free API. No backend required.

Features
- Prompt builder with templates (Product shot, Portrait, Landscape, Interior design, Food photo, UI icon)
- Style presets (Cinematic, Photoreal, Isometric, Watercolor, Cyberpunk, Anime, 3D Render)
- Variations (1/2/4) and optional A/B model compare
- Per‑image actions (Download, Share, Copy link)
- Progress bar and rotating logo loader while images stream
- Local seeded Community Feed for instant first paint + live SSE streaming with auto‑retry
- PWA install + OG/Twitter meta

## Quickstart
1) Install dependencies
```bash
npm install
```

2) Run the dev server
```bash
npm run dev
```

3) Seed feed images (already included)
- We bundle 12 example images under `public/seed/` referenced by `public/seed-feed.json` for instant feed.

## Build & Deploy to GitHub Pages
```bash
npm run deploy
```
This builds the app and publishes `dist/` to the `gh-pages` branch with the correct base path.

## Configuration
- Pollinations endpoint used:
  `https://image.pollinations.ai/prompt/{PROMPT}?width=...&height=...&seed=...&model=...&nologo=true&enhance=false`
- No API keys required. Sharing uses the Web Share API or copies links to the clipboard.

## Project Structure
```
public/
  favicon.svg
  logo.svg
  seed-feed.json      # metadata for initial Community Feed items
  seed/               # 12 local images for instant feed
src/
  App.jsx             # main UI, image grid, loaders, actions
  components/
    Feed.jsx          # Community Feed (seed + SSE, auto-retry)
    InfoTip.jsx       # Tooltip component
    Nav.jsx           # Create/History tabs
  index.css           # Tailwind styles + helpers
  main.jsx            # bootstrapping + PWA registration
```

## Key UX Details
- Mobile
  - Single column grid for generated images
  - Per-image icon row under each image (Download/Share/Copy)
  - “Advanced settings” collapsible with Seed/No logo/Enhance/A/B Compare
- Desktop
  - Hover toolbar on each image with labels
  - Tabs in navbar; social links to X, LinkedIn, GitHub

## PWA
Manifest and service worker are included; the app is installable. Static assets are cached; HTML uses network-first with offline fallback.

## Acknowledgements
- [Pollinations API](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md)
- Icons: [lucide-react](https://github.com/lucide-icons/lucide)

## License
MIT
