# Understanding Knee Osteoarthritis — Reveal.js

A public-friendly Klinik Inocare presentation covering:

- knee osteoarthritis in plain language;
- the Kellgren–Lawrence (KL) X-ray grading scale;
- normal and abnormal knee ultrasound findings; and
- how patients can discuss imaging results with a clinician.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Use the arrow keys or swipe to move between slides. Press `S` for presenter view, `O` for overview and `?` for Reveal.js keyboard help.

## Build for Netlify

```bash
npm install
npm run build
```

The production site is generated in `dist/`.

The included `netlify.toml` configures:

- build command: `npm run build`
- publish directory: `dist`
- Node.js: version 24

To deploy later, connect this repository in Netlify and accept the detected settings.

## Editing content

- Slide markup and presenter notes: `index.html`
- Klinik Inocare styling: `src/styles.css`
- Reveal.js settings: `src/main.js`
- Images and logos: `public/assets/`
- Original PowerPoint download: `public/downloads/`

## Medical-use note

This presentation is for general education. It does not replace an individual assessment, diagnosis or treatment plan from a qualified healthcare professional.

## Sources and image attribution

Slide-level sources are included in the Reveal.js presenter notes. See [ATTRIBUTION.md](ATTRIBUTION.md) for the consolidated evidence and image list.
