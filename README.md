# Imagine — Pollinations Image Generator

A stylish, responsive React + Vite + Tailwind app to generate images using Pollinations’ free API. No backend required.

Features
- Prompt builder with templates
  - 1‑click templates for common use‑cases: Product shot, Portrait, Landscape, Interior design, Food photo, UI icon
  - Inline builder lets you fill placeholders (e.g., subject/place) and preview the final prompt
  - Replace or Append the template to your current prompt
- Style presets
  - Quickly add stylistic guidance: Cinematic, Photoreal, Isometric, Watercolor, Cyberpunk, Anime, 3D Render
  - Presets are appended to your prompt only at generation time so your original text stays editable
- Variations & A/B compare
  - Generate 1/2/4 variations by using different seeds
  - Optional A/B compare renders the same prompt with two models side‑by‑side
  - Labeled tiles (v1.. or A/B with seed) make it easy to reference results
- Per‑image actions
  - Download (filename includes model/size/seed), Share (Web Share API when available), Copy link
  - On desktop, actions appear on hover; on mobile, a compact icon row is always visible under each image
- History & Remix
  - Each successful generation is stored with parameters
  - “Remix” loads the item back into the form without auto‑generating so you can tweak first
- Community Feed
  - Ships with 12 local seed images (public/seed + seed-feed.json) for instant first paint
  - Then streams live creations from Pollinations via SSE, with automatic retry if temporarily unavailable
  - De‑duped so seed items won’t duplicate when the live stream catches up
- Loaders & feedback
  - Progress bar across the top of the Generated section while a request is in flight
  - Rotating logo placeholder in each tile (and in the Community Feed) until the image finishes loading
  - Toasts for key actions (copied links, downloads, errors)
- Mobile‑first UX
  - Single column grid, collapsible “Advanced settings” (Seed/No logo/Enhance/A‑B)
  - Tabs and social links optimized for small screens; per‑image action icons only
- PWA & meta
  - Installable (manifest + service worker), basic offline support for static assets
  - OG/Twitter meta for better link previews

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
