// Fade sections in as they scroll into view
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Curved hero carousel: cards sit on a concave cylinder (edge cards turn toward
// the viewer) and switch one at a time, gliding the next project into the centre.
const carousel = document.querySelector(".carousel");
if (carousel) {
  // Repeat the card set until the loop is comfortably wider than the screen
  const originals = [...carousel.querySelectorAll(".ccard")];
  const stepEstimate = originals[0].offsetWidth + 14;
  while (carousel.children.length * stepEstimate < Math.max(innerWidth, screen.width) * 1.6) {
    originals.forEach((c) => {
      const clone = c.cloneNode(true);
      clone.setAttribute("aria-hidden", "true"); // repeats are decorative
      clone.tabIndex = -1;
      carousel.appendChild(clone);
    });
  }
  const cards = [...carousel.querySelectorAll(".ccard")];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INTERVAL = 3200; // ms each card stays in focus before switching
  const GAP = 14;

  let index = 0;   // which slot is centred
  let offset = 0;  // current scroll position (eases toward the target)
  let paused = false;
  let lastSwitch = performance.now();
  let last = performance.now();

  const metrics = () => {
    const cardW = cards[0].offsetWidth;
    const step = cardW + GAP;
    const total = cards.length * step;
    // Offset at which some card sits exactly in the centre
    const base = ((total / 2) % step + step) % step;
    return { cardW, step, total, base };
  };
  const targetOffset = () => {
    const { step, base } = metrics();
    return base + index * step;
  };

  const render = () => {
    const cw = carousel.clientWidth;
    const { cardW, step, total } = metrics();
    const half = cw / 2;

    cards.forEach((card, i) => {
      // Position along the loop, centred on 0
      const x = ((((i * step - offset) % total) + total) % total) - total / 2;
      const p = Math.max(-1.25, Math.min(1.25, x / half));
      const angle = -p * 28;
      const z = p * p * 140 * Math.min(1, cw / 900); // gentler curve on small screens
      card.style.transform =
        `translateX(${half + x - cardW / 2}px) translateZ(${z}px) rotateY(${angle}deg)`;
      card.style.zIndex = Math.round(Math.abs(p) * 100);
    });
  };

  const go = (dir) => {
    index += dir;
    lastSwitch = performance.now();
  };

  // Hold the current card while the visitor hovers or tabs into the carousel
  carousel.addEventListener("mouseenter", () => (paused = true));
  carousel.addEventListener("mouseleave", () => { paused = false; lastSwitch = performance.now(); });
  carousel.addEventListener("focusin", () => (paused = true));
  carousel.addEventListener("focusout", () => (paused = false));

  document.querySelector(".cnav-prev")?.addEventListener("click", () => go(-1));
  document.querySelector(".cnav-next")?.addEventListener("click", () => go(1));

  const tick = (now) => {
    if (!paused && !reduceMotion && now - lastSwitch > INTERVAL) go(1);
    // Smoothly glide to the target card (time-based easing)
    const k = 1 - Math.exp(-(now - last) / 160);
    offset += (targetOffset() - offset) * k;
    last = now;
    render();
    requestAnimationFrame(tick);
  };

  offset = targetOffset();
  render();
  addEventListener("resize", () => { offset = targetOffset(); render(); });
  requestAnimationFrame((t) => { last = t; tick(t); });
}
