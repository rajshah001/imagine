# Imagine — Pollinations Image Generator

A stylish, responsive React + Vite frontend to generate images using Pollinations’ free API. No backend required. Includes prompt controls, parameters, progress bar, download and share options.

## Quickstart

1. Install dependencies:

```
npm install
```

2. Run the dev server:

```
npm run dev
```

3. Optional: set an Imgur client ID to enable anonymous uploads in the Share button.

Create `.env` and add:

```
VITE_IMGUR_CLIENT_ID=YOUR_CLIENT_ID
```

## Build & Deploy to GitHub Pages

```
npm run deploy
```

This runs a production build with the proper base path and pushes `dist/` to the `gh-pages` branch via `gh-pages`.

## Notes
- Uses the endpoint `https://image.pollinations.ai/prompt/{PROMPT}?width=...&height=...&seed=...&model=...&nologo=true&enhance=false`.
- If you omit `VITE_IMGUR_CLIENT_ID`, the Share button uses the Web Share API when available or copies the image URL to the clipboard.
