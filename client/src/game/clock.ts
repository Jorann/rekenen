/**
 * A clock that only runs while the app is on screen. When the iPad locks or she switches apps,
 * that time is left out, so a question left open over dinner doesn't count as a 40-minute answer.
 */
let hiddenTotal = 0;
let hiddenSince: number | null = document.hidden ? performance.now() : null;

document.addEventListener('visibilitychange', () => {
  const now = performance.now();
  if (document.hidden) {
    hiddenSince ??= now;
  } else if (hiddenSince !== null) {
    hiddenTotal += now - hiddenSince;
    hiddenSince = null;
  }
});

/** Milliseconds of on-screen time since the page loaded. Only differences between two calls are meaningful. */
export function activeNow(): number {
  const now = performance.now();
  return now - hiddenTotal - (hiddenSince === null ? 0 : now - hiddenSince);
}
