import confetti from 'canvas-confetti';

export const RAINBOW = ['#ff5e7e', '#ff9f43', '#ffd93d', '#6bcb77', '#4d96ff', '#9b5de5', '#ff8fd8'];

let emojiShapes: confetti.Shape[] | null = null;
function emoji(): confetti.Shape[] {
  emojiShapes ??= ['🦄', '🌈', '⭐', '💖'].map((text) => confetti.shapeFromText({ text, scalar: 2.2 }));
  return emojiShapes;
}

function originOf(el: Element | null): { x: number; y: number } {
  if (!el) return { x: 0.5, y: 0.5 };
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
}

/** Small sparkle when a sum is right. */
export function sparkle(el: Element | null): void {
  void confetti({
    particleCount: 36,
    spread: 80,
    startVelocity: 26,
    ticks: 90,
    scalar: 0.9,
    origin: originOf(el),
    colors: RAINBOW,
    shapes: ['star', 'circle'],
  });
}

/** Burst at the end of a round. */
export function roundBurst(): void {
  void confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.75 }, colors: RAINBOW });
  setTimeout(() => {
    void confetti({ particleCount: 14, spread: 90, startVelocity: 35, scalar: 2.2, flat: true, origin: { x: 0.5, y: 0.7 }, shapes: emoji() });
  }, 250);
}

let buyShapes: confetti.Shape[] | null = null;

/** A burst of sparkles and hearts from something she just bought. */
export function purchaseBurst(el: Element | null): void {
  buyShapes ??= ['✨', '💖', '⭐'].map((text) => confetti.shapeFromText({ text, scalar: 2 }));
  const origin = originOf(el);
  void confetti({ particleCount: 90, spread: 110, startVelocity: 38, origin, colors: RAINBOW, zIndex: 200 });
  void confetti({ particleCount: 16, spread: 120, startVelocity: 30, scalar: 2, flat: true, origin, shapes: buyShapes, zIndex: 200 });
}

/** Fireworks from both sides for the grand finale. Returns a function that stops them. */
export function grandFinale(durationMs = 7000): () => void {
  const end = Date.now() + durationMs;
  let stopped = false;
  const frame = () => {
    if (stopped || Date.now() > end) return;
    void confetti({ particleCount: 6, angle: 60, spread: 60, startVelocity: 60, origin: { x: 0, y: 0.8 }, colors: RAINBOW });
    void confetti({ particleCount: 6, angle: 120, spread: 60, startVelocity: 60, origin: { x: 1, y: 0.8 }, colors: RAINBOW });
    requestAnimationFrame(frame);
  };
  frame();
  const bursts = [600, 1800, 3000, 4200].map((t) =>
    setTimeout(() => {
      void confetti({
        particleCount: 18,
        spread: 140,
        startVelocity: 40,
        scalar: 2.2,
        flat: true,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.4 },
        shapes: emoji(),
      });
    }, t),
  );
  return () => {
    stopped = true;
    bursts.forEach(clearTimeout);
    confetti.reset();
  };
}
