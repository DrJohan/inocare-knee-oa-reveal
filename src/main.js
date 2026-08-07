import Reveal from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes";
import RevealZoom from "reveal.js/plugin/zoom";
import "reveal.js/reveal.css";
import "./styles.css";

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
  plugins: [RevealNotes, RevealZoom],
});

deck.initialize();
