import Reveal from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes";
import RevealZoom from "reveal.js/plugin/zoom";
import "reveal.js/reveal.css";
import "./styles.css";

const chalkboardPlugin = window.RevealChalkboard;
const urlParams = new URLSearchParams(window.location.search);
const isSpeakerPreview =
  urlParams.has("receiver") ||
  (window.self !== window.top && urlParams.get("progress") === "false" && urlParams.get("transition") === "none");
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

const menu = document.querySelector("#presentation-menu");
const menuToggle = document.querySelector("#presentation-menu-toggle");
const menuPanel = document.querySelector("#presentation-menu-panel");
const status = document.querySelector("#chalkboard-status");
const nativeWindowOpen = window.open.bind(window);
let statusTimer;
let presenterWindow = null;
let presenterWindowMonitor = null;

function getFullscreenElement(targetDocument) {
  return targetDocument.fullscreenElement || targetDocument.webkitFullscreenElement || null;
}

async function toggleFullscreen(targetDocument) {
  const activeElement = getFullscreenElement(targetDocument);

  try {
    if (activeElement) {
      const exit =
        targetDocument.exitFullscreen ||
        targetDocument.webkitExitFullscreen ||
        targetDocument.webkitCancelFullScreen;
      if (!exit) return { ok: false, supported: false, active: true };
      await exit.call(targetDocument);
      return { ok: true, supported: true, active: false };
    }

    const target = targetDocument.documentElement;
    const request =
      target.requestFullscreen ||
      target.webkitRequestFullscreen ||
      target.webkitRequestFullScreen ||
      target.mozRequestFullScreen ||
      target.msRequestFullscreen;
    if (!request) return { ok: false, supported: false, active: false };
    await request.call(target);
    return { ok: true, supported: true, active: true };
  } catch (error) {
    return { ok: false, supported: true, active: Boolean(getFullscreenElement(targetDocument)), error };
  }
}

function announce(message) {
  if (!status || isSpeakerPreview) return;
  window.clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.add("is-visible");
  statusTimer = window.setTimeout(() => status.classList.remove("is-visible"), 2200);
}

function setMenuOpen(open, focusFirst = false) {
  if (!menu || !menuToggle || !menuPanel) return;
  menu.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close presentation menu" : "Open presentation menu");
  menuPanel.hidden = !open;

  if (open && focusFirst) {
    menuPanel.querySelector(".presentation-menu-item")?.focus();
  }
}

function syncMenuState() {
  if (!menu || isSpeakerPreview) return;
  const notesCanvas = document.querySelector("#notescanvas");
  const boardCanvas = document.querySelector("#chalkboard");
  const notesActive = notesCanvas?.style.pointerEvents !== "none";
  const boardActive = boardCanvas?.style.visibility === "visible" && boardCanvas?.style.opacity !== "0";
  const fullscreenActive = Boolean(getFullscreenElement(document));
  const presenterActive = Boolean(presenterWindow && !presenterWindow.closed);

  for (const button of menu.querySelectorAll("[data-presentation-action]")) {
    const action = button.dataset.presentationAction;
    const active =
      (action === "notes" && notesActive) ||
      (action === "board" && boardActive) ||
      (action === "fullscreen" && fullscreenActive) ||
      (action === "presenter" && presenterActive);

    if (["notes", "board", "fullscreen", "presenter"].includes(action)) {
      button.setAttribute("aria-pressed", String(Boolean(active)));
      button.classList.toggle("is-active", Boolean(active));
    }

    const label = button.querySelector("[data-presentation-label]");
    if (action === "fullscreen" && label) label.textContent = fullscreenActive ? "Exit full screen" : "Full screen";
    if (action === "presenter" && label) label.textContent = presenterActive ? "Focus presenter view" : "Presenter view";
  }
}

function monitorPresenterWindow() {
  window.clearInterval(presenterWindowMonitor);
  presenterWindowMonitor = window.setInterval(() => {
    if (!presenterWindow || presenterWindow.closed) {
      presenterWindow = null;
      window.clearInterval(presenterWindowMonitor);
      presenterWindowMonitor = null;
      syncMenuState();
    }
  }, 800);
}

function installPresenterMenu(targetWindow, attempt = 0) {
  if (!targetWindow || targetWindow.closed || attempt > 30) return;

  try {
    const targetDocument = targetWindow.document;
    if (!targetDocument.body || !targetDocument.querySelector("#speaker-controls")) {
      window.setTimeout(() => installPresenterMenu(targetWindow, attempt + 1), 100);
      return;
    }

    if (targetDocument.querySelector("#inocare-speaker-menu")) return;

    const style = targetDocument.createElement("style");
    style.id = "inocare-speaker-menu-style";
    style.textContent = `
      #speaker-layout { right: 76px !important; }
      #inocare-speaker-menu {
        position: fixed;
        top: max(12px, env(safe-area-inset-top));
        right: max(12px, env(safe-area-inset-right));
        z-index: 1000;
        font-family: Arial, Helvetica, sans-serif;
      }
      #inocare-speaker-menu button {
        font-family: inherit;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      #inocare-speaker-toggle {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        margin-left: auto;
        padding: 0;
        border: 1px solid rgba(35, 65, 115, 0.22);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.96);
        color: #234173;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
      }
      #inocare-speaker-toggle[aria-expanded="true"] { background: #234173; color: #fff; }
      #inocare-speaker-toggle svg { width: 24px; height: 24px; fill: currentColor; }
      #inocare-speaker-panel {
        position: absolute;
        top: 56px;
        right: 0;
        width: min(290px, calc(100vw - 28px));
        padding: 10px;
        border: 1px solid rgba(35, 65, 115, 0.18);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 18px 44px rgba(15, 23, 42, 0.24);
      }
      #inocare-speaker-panel[hidden] { display: none; }
      .inocare-speaker-heading {
        margin: 2px 10px 6px;
        color: #64748b;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .inocare-speaker-action {
        min-height: 56px;
        width: 100%;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        gap: 12px;
        align-items: center;
        padding: 8px 10px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: #1e293b;
        text-align: left;
      }
      .inocare-speaker-action:active { background: #eaf2fa; }
      .inocare-speaker-action svg {
        width: 25px;
        height: 25px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.9;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .inocare-speaker-action span { display: grid; gap: 3px; }
      .inocare-speaker-action strong { font-size: 16px; line-height: 1.15; }
      .inocare-speaker-action small { color: #64748b; font-size: 13px; line-height: 1.2; }
      #inocare-speaker-status {
        position: fixed;
        top: max(20px, env(safe-area-inset-top));
        left: 50%;
        z-index: 1001;
        padding: 10px 16px;
        border-radius: 999px;
        background: rgba(30, 41, 59, 0.94);
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -8px);
        transition: opacity 160ms ease, transform 160ms ease;
      }
      #inocare-speaker-status.visible { opacity: 1; transform: translate(-50%, 0); }
      @media print { #inocare-speaker-menu, #inocare-speaker-status { display: none !important; } }
    `;
    targetDocument.head.append(style);

    const speakerMenu = targetDocument.createElement("div");
    speakerMenu.id = "inocare-speaker-menu";
    speakerMenu.innerHTML = `
      <button id="inocare-speaker-toggle" type="button" aria-label="Open presenter menu" aria-haspopup="menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="2" rx="1"/><rect x="4" y="11" width="16" height="2" rx="1"/><rect x="4" y="17" width="16" height="2" rx="1"/></svg>
      </button>
      <div id="inocare-speaker-panel" role="menu" hidden>
        <p class="inocare-speaker-heading">Presenter view</p>
        <button class="inocare-speaker-action" type="button" data-speaker-action="fullscreen" role="menuitem">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/></svg>
          <span><strong>Full screen</strong><small>Fill the iPad display</small></span>
        </button>
        <button class="inocare-speaker-action" type="button" data-speaker-action="slides" role="menuitem">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></svg>
          <span><strong>Return to slides</strong><small>Close presenter view</small></span>
        </button>
      </div>
    `;
    const speakerStatus = targetDocument.createElement("div");
    speakerStatus.id = "inocare-speaker-status";
    speakerStatus.setAttribute("role", "status");
    speakerStatus.setAttribute("aria-live", "polite");
    targetDocument.body.append(speakerMenu, speakerStatus);

    const speakerToggle = speakerMenu.querySelector("#inocare-speaker-toggle");
    const speakerPanel = speakerMenu.querySelector("#inocare-speaker-panel");
    const fullscreenButton = speakerMenu.querySelector('[data-speaker-action="fullscreen"]');
    let speakerStatusTimer;

    const setSpeakerMenuOpen = (open) => {
      speakerPanel.hidden = !open;
      speakerToggle.setAttribute("aria-expanded", String(open));
      speakerToggle.setAttribute("aria-label", open ? "Close presenter menu" : "Open presenter menu");
    };

    const announceInSpeaker = (message) => {
      targetWindow.clearTimeout(speakerStatusTimer);
      speakerStatus.textContent = message;
      speakerStatus.classList.add("visible");
      speakerStatusTimer = targetWindow.setTimeout(() => speakerStatus.classList.remove("visible"), 2200);
    };

    const syncSpeakerFullscreen = () => {
      const active = Boolean(getFullscreenElement(targetDocument));
      fullscreenButton.querySelector("strong").textContent = active ? "Exit full screen" : "Full screen";
      fullscreenButton.setAttribute("aria-pressed", String(active));
    };

    speakerToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setSpeakerMenuOpen(speakerPanel.hidden);
    });

    speakerMenu.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-speaker-action]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      setSpeakerMenuOpen(false);

      if (button.dataset.speakerAction === "fullscreen") {
        const result = await toggleFullscreen(targetDocument);
        if (!result.supported) announceInSpeaker("Full screen is not available in this browser");
        else if (!result.ok) announceInSpeaker("Full screen was blocked—please try again");
        else announceInSpeaker(result.active ? "Presenter view is full screen" : "Exited full screen");
        syncSpeakerFullscreen();
      }

      if (button.dataset.speakerAction === "slides") {
        try {
          targetWindow.opener?.focus();
        } finally {
          targetWindow.close();
        }
      }
    });

    targetDocument.addEventListener("pointerdown", (event) => {
      if (!speakerPanel.hidden && !speakerMenu.contains(event.target)) setSpeakerMenuOpen(false);
    });
    targetDocument.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !speakerPanel.hidden) {
        event.preventDefault();
        setSpeakerMenuOpen(false);
        speakerToggle.focus();
      }
    });
    targetDocument.addEventListener("fullscreenchange", syncSpeakerFullscreen);
    targetDocument.addEventListener("webkitfullscreenchange", syncSpeakerFullscreen);
    syncSpeakerFullscreen();
  } catch {
    window.setTimeout(() => installPresenterMenu(targetWindow, attempt + 1), 100);
  }
}

if (!isSpeakerPreview) {
  window.open = (url, target, features) => {
    const openedWindow = nativeWindowOpen(url, target, features);
    if (target === "reveal.js - Notes" && openedWindow) {
      presenterWindow = openedWindow;
      window.setTimeout(() => installPresenterMenu(openedWindow), 0);
      monitorPresenterWindow();
      window.setTimeout(syncMenuState, 0);
    }
    return openedWindow;
  };
}

function setupPresentationMenu() {
  if (!menu || !menuToggle || !menuPanel || isSpeakerPreview) {
    menu?.setAttribute("hidden", "");
    status?.setAttribute("hidden", "");
    return;
  }

  const actions = {
    fullscreen: async () => {
      const result = await toggleFullscreen(document);
      if (!result.supported) announce("Full screen is not available in this browser");
      else if (!result.ok) announce("Full screen was blocked—please try again");
      else announce(result.active ? "Presentation is full screen" : "Exited full screen");
      deck.layout();
      syncMenuState();
    },
    presenter: () => {
      const notesPlugin = deck.getPlugin("notes");
      if (!notesPlugin?.open) {
        announce("Presenter view is not available");
        return;
      }
      notesPlugin.open();
      announce("Presenter view opened • shortcut S");
      if (presenterWindow) window.setTimeout(() => installPresenterMenu(presenterWindow), 80);
    },
    notes: () => {
      chalkboardPlugin?.toggleNotesCanvas();
      announce("Slide drawing toggled • shortcut C");
    },
    board: () => {
      chalkboardPlugin?.toggleChalkboard();
      announce("Chalkboard toggled • shortcut B");
    },
    color: () => {
      chalkboardPlugin?.colorNext();
      announce("Drawing colour changed • shortcut X");
    },
    clear: () => {
      chalkboardPlugin?.clear();
      announce("Current drawing cleared • shortcut Delete");
    },
  };

  if (!chalkboardPlugin) {
    for (const button of menu.querySelectorAll('[data-presentation-action="notes"], [data-presentation-action="board"], [data-presentation-action="color"], [data-presentation-action="clear"]')) {
      button.hidden = true;
    }
  }

  menu.setAttribute("data-prevent-swipe", "true");
  menuToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(menuPanel.hidden);
  });

  menu.addEventListener("pointerdown", (event) => event.stopPropagation());
  menu.addEventListener("touchstart", (event) => event.stopPropagation(), { passive: true });
  menu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-presentation-action]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const action = button.dataset.presentationAction;
    setMenuOpen(false);
    actions[action]?.();
    window.setTimeout(syncMenuState, 0);
  });

  menu.addEventListener("keydown", (event) => {
    const items = [...menuPanel.querySelectorAll(".presentation-menu-item:not([hidden])")];
    const currentIndex = items.indexOf(targetElement(event));

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      if (menuPanel.hidden) {
        setMenuOpen(true, true);
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + items.length) % items.length;
      items[nextIndex]?.focus();
    }

    if (event.key === "Escape" && !menuPanel.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!menuPanel.hidden && !menu.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["b", "c", "s", "Delete", "Backspace"].includes(key)) {
      window.setTimeout(syncMenuState, 0);
    }
  });

  const onFullscreenChange = () => {
    deck.layout();
    syncMenuState();
  };
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  deck.on("slidechanged", () => {
    setMenuOpen(false);
    syncMenuState();
  });
  syncMenuState();
}

function targetElement(event) {
  return event.target instanceof Element ? event.target.closest(".presentation-menu-item") : null;
}

deck.initialize().then(setupPresentationMenu);
