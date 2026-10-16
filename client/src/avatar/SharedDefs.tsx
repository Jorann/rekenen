/**
 * Gradients and patterns used by many drawings, defined once for the whole page and referenced as url(#id).
 * Rendered as a zero-size svg: with display:none Safari would drop the gradients.
 */
export const RAINBOW_STOPS = ['#ff5e7e', '#ff9f43', '#ffd93d', '#6bcb77', '#4d96ff', '#9b5de5'];

export function SharedDefs() {
  const stops = RAINBOW_STOPS.map((c, i) => <stop key={c} offset={i / (RAINBOW_STOPS.length - 1)} stopColor={c} />);
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rainbow-v" x1="0" y1="0" x2="0" y2="1">
          {stops}
        </linearGradient>
        <linearGradient id="rainbow-h" x1="0" y1="0" x2="1" y2="0">
          {stops}
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.45" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#f0a500" />
        </linearGradient>
        <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#dfe6f2" />
          <stop offset="1" stopColor="#aab6cc" />
        </linearGradient>
        <radialGradient id="pearl" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9dff5" />
        </radialGradient>
        <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9f3ff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#e9d1ff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffd1ec" stopOpacity="0.9" />
        </linearGradient>
        <pattern id="glitter" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1.3" fill="#fff" opacity="0.9" />
          <circle cx="10" cy="10" r="1" fill="#fff" opacity="0.8" />
          <circle cx="11" cy="3" r="0.7" fill="#fff8b0" />
        </pattern>
        <pattern id="denim" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#5b8fd6" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#4a7bc2" strokeWidth="2" />
        </pattern>
        <pattern id="stripes" width="12" height="13" patternUnits="userSpaceOnUse">
          <rect y="7" width="12" height="5.5" fill="#fff" opacity="0.9" />
        </pattern>
        <pattern id="dots" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2.2" fill="#fff" opacity="0.9" />
          <circle cx="10" cy="10" r="2.2" fill="#fff" opacity="0.9" />
        </pattern>
        <pattern id="rainbow-skirt" width="200" height="400" patternUnits="userSpaceOnUse">
          {RAINBOW_STOPS.map((c, i) => (
            <rect key={c} y={196 + i * 9.5} width="200" height="9.5" fill={c} />
          ))}
        </pattern>
        <pattern id="checks" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#fff" opacity="0.35" />
          <rect x="8" y="8" width="8" height="8" fill="#fff" opacity="0.35" />
        </pattern>
      </defs>
    </svg>
  );
}
