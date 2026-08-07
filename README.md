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

## iPad presentation menu

Tap the three-dot button in the top-right corner to open the presentation menu. The menu remains available when the slide deck is full screen and contains:

- **Full screen:** enter or exit browser full screen.
- **Presenter view:** open the current slide, next slide, timer and speaker notes.
- **Drawing tools:** draw on a slide, open the chalkboard, change colour or clear the current drawing.

Presenter view has its own three-dot menu. Use it to make the presenter window full screen or return to the main slides. If Safari blocks presenter view, allow pop-ups for the site and tap the option again.

## Chalkboard and live drawing

The drawing section inside the three-dot menu provides four controls:

- **Draw:** annotate directly over the current slide.
- **Board:** open or close a full-screen chalkboard.
- **Colour:** cycle through the available drawing colours.
- **Clear:** clear the current slide drawing.

Keyboard shortcuts:

- `C` — toggle drawing over the current slide
- `B` — toggle the full chalkboard
- `X` / `Y` — next or previous colour
- `Delete` — clear the current slide drawing
- `Backspace` — reset all saved drawings after confirmation
- `D` — download the drawing data

Drag with a mouse, stylus or finger to draw. Right-click and drag to erase; on touchscreens, touch and hold before moving to erase. Drawings are retained for the current browser-tab session.

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
- Chalkboard plugin: `public/plugins/chalkboard/`
- Original PowerPoint download: `public/downloads/`

## Medical-use note

This presentation is for general education. It does not replace an individual assessment, diagnosis or treatment plan from a qualified healthcare professional.

## Sources and image attribution

Slide-level sources are included in the Reveal.js presenter notes. See [ATTRIBUTION.md](ATTRIBUTION.md) for the consolidated evidence and image list.
