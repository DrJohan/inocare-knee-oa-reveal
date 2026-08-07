import Reveal from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes";
import RevealZoom from "reveal.js/plugin/zoom";
import "reveal.js/reveal.css";
import "./styles.css";

const chalkboardPlugin = window.RevealChalkboard;
const slides = [...document.querySelectorAll(".reveal .slides > section")];

for (const slide of slides) {
  const isDark = slide.classList.contains("dark");
  const chrome = document.createElement("div");
  chrome.className = "brand-chrome";
  chrome.innerHTML = `
    <img src="assets/${isDark ? "inocare_logo_white.png" : "inocare_logo_dark.png"}" alt="Klinik Inocare — Wound Care & Wellness Centre" />
    <span class="slide-number-static">${slide.dataset.number ?? ""}</span>
  `;
  slide.prepend(chrome);

  if (!isDark) {
    const footer = document.createElement("p");
    footer.className = "education-footer";
    footer.textContent = "Knee osteoarthritis • Public education";
    slide.append(footer);
  }
}

const plugins = [RevealNotes, RevealZoom];
if (chalkboardPlugin) plugins.push(chalkboardPlugin);

const deck = new Reveal({
  hash: true,
  controls: true,
  controlsTutorial: true,
  progress: true,
  slideNumber: false,
  center: false,
  width: 1280,
  height: 720,
  margin: 0.02,
  minScale: 0.2,
  maxScale: 2,
  transition: "fade",
  backgroundTransition: "fade",
  navigationMode: "linear",
  touch: true,
  overview: true,
  keyboard: true,
  embedded: false,
  chalkboard: {
    theme: "chalkboard",
    boardmarkerWidth: 4,
    chalkWidth: 6,
    chalkEffect: 0.75,
    storage: "inocare-knee-oa-chalkboard",
    readOnly: false,
    transition: 800,
    rememberColor: [true, true],
    colorButtons: false,
    boardHandle: false,
    toggleChalkboardButton: false,
    toggleNotesButton: false,
    grid: {
      color: "rgba(83, 138, 195, 0.28)",
      distance: 80,
      width: 1,
    },
  },
  plugins,
});

const toolbar = document.querySelector("#chalkboard-toolbar");
const status = document.querySelector("#chalkboard-status");
let statusTimer;

function announce(message) {
  if (!status) return;
  window.clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.add("is-visible");
  statusTimer = window.setTimeout(() => status.classList.remove("is-visible"), 2200);
}

function syncToolState() {
  if (!toolbar) return;
  const notesCanvas = document.querySelector("#notescanvas");
  const boardCanvas = document.querySelector("#chalkboard");
  const notesActive = notesCanvas?.style.pointerEvents !== "none";
  const boardActive = boardCanvas?.style.visibility === "visible" && boardCanvas?.style.opacity !== "0";

  for (const button of toolbar.querySelectorAll("[data-chalkboard-action]")) {
    const action = button.dataset.chalkboardAction;
    const active = (action === "notes" && notesActive) || (action === "board" && boardActive);
    if (action === "notes" || action === "board") {
      button.setAttribute("aria-pressed", String(Boolean(active)));
      button.classList.toggle("is-active", Boolean(active));
    }
  }
}

function setupChalkboardToolbar() {
  if (!toolbar || !chalkboardPlugin) {
    toolbar?.setAttribute("hidden", "");
    return;
  }

  const actions = {
    notes: () => {
      chalkboardPlugin.toggleNotesCanvas();
      announce("Slide drawing toggled • shortcut C");
    },
    board: () => {
      chalkboardPlugin.toggleChalkboard();
      announce("Chalkboard toggled • shortcut B");
    },
    color: () => {
      chalkboardPlugin.colorNext();
      announce("Drawing colour changed • shortcut X");
    },
    clear: () => {
      chalkboardPlugin.clear();
      announce("Clear current drawing • shortcut Delete");
    },
  };

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chalkboard-action]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    actions[button.dataset.chalkboardAction]?.();
    window.setTimeout(syncToolState, 0);
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["b", "c", "Delete", "Backspace"].includes(key)) {
      window.setTimeout(syncToolState, 0);
    }
  });

  deck.on("slidechanged", syncToolState);
  syncToolState();
}

deck.initialize().then(setupChalkboardToolbar);
