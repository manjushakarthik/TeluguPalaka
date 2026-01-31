# TeluguPalaka – Archived Code (before fresh start)

This folder is a snapshot of the full TeluguPalaka app as of the fresh-start reset.

**Contents:**
- `src/` – All React components, hooks, data, and styles (Learn mode, Quiz mode, tracing, progress, audio, first-vowel GIF demo, etc.)
- `public/` – Audio recording instructions, favicon
- Config files – `package.json`, `vite.config.ts`, `tsconfig*.json`, `postcss.config.js`, `tailwind.config.js`, `eslint.config.js`, `index.html`

**To restore this app:** Copy the contents of `src/` back into the project’s `src/`, restore `public/` and any config you changed, then run `npm install` and `npm run dev`.

**Features in this snapshot:**
- Learning mode: 16 Telugu vowels (achulu), dotted-letter tracing, write-from-memory, progress tracking
- First vowel (అ): split layout with Wikimedia hand-writing GIF, Animate + Clear, “Practice here”
- Quiz mode: TTS + multiple choice, optional pre-recorded audio from `public/audio/`
- Test yourself (inline quiz from learning), Watch (letter formation animation)
