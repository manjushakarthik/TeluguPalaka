# TeluguPalaka

A web app to learn and practice writing Telugu script. Start with the vowels (అచ్చులు / *achulu*) by tracing dotted letters and watching stroke order.

## What it does

- **Letter grid** — Pick any of the 16 Telugu vowels to practice.
- **Practice view** — Trace over a dotted outline with your mouse or finger. Clear the canvas and try again anytime.
- **Watch stroke order** — For the first vowel (అ), a reference animation shows how to write it (Wikimedia Commons GIF).
- **Customize** — Adjust letter size, stroke width, and stroke color.
- **Progress** — See how many strokes you drew and how that compares to the reference; stroke-order accuracy for single-stroke letters (100% for one stroke, 0% for wrong stroke count).
- **Download & print** — Save your tracing as a PNG or print a worksheet with the dotted letter.

## Tech

- **React 18** + **TypeScript** + **Vite**
- Plain CSS (Noto Sans Telugu for the letters)
- Reference stroke data and format are in `src/data/` for future accuracy or more letters

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. http://localhost:5173).

## Build

```bash
npm run build
```

Output is in `dist/`.

## Deploy to Cloudflare

The app is a static SPA. To deploy with Wrangler (Workers / Pages):

1. **Build then deploy** — Use the deploy script so `dist/` exists before Wrangler runs:
   ```bash
   npm run deploy
   ```
   Or in Cloudflare’s dashboard set **Build command** to `npm run build` and **Deploy command** to `npx wrangler deploy` (and ensure the build step runs first).

2. **Config** — `wrangler.jsonc` points Wrangler at `./dist` as the static assets directory. No Worker script is required.

## Project layout

- `src/App.tsx` — Letter grid vs practice view
- `src/components/LetterGrid.tsx` — Vowel tiles
- `src/components/PracticeView.tsx` — Dotted letter, canvas, controls, progress
- `src/data/achulu.ts` — Telugu vowels (id, symbol, name)
- `src/data/strokeReference.ts` — Reference stroke count and paths (e.g. అ)
- `src/data/strokeOrderAccuracy.ts` — Stroke-order accuracy logic
- `src/data/STROKE_DATA_FORMAT.md` — How to add reference path data for more letters

## License

MIT (or your choice). The stroke-order animation for అ is from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Animation_of_hand-writing_Kannada_and_Telugu_character_%22%E0%B0%85%22.gif) (CC BY-SA 4.0, Subhashish Panigrahi).
