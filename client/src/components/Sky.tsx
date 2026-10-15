const SPARKLES = [
  { left: 8, top: 14, delay: 0 },
  { left: 88, top: 10, delay: 1.2 },
  { left: 22, top: 78, delay: 0.6 },
  { left: 72, top: 64, delay: 2.1 },
  { left: 50, top: 6, delay: 1.7 },
  { left: 94, top: 86, delay: 0.3 },
  { left: 4, top: 52, delay: 2.6 },
];

/** Soft pastel sky with drifting clouds behind every screen. */
export function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-cloud c1" />
      <div className="sky-cloud c2" />
      <div className="sky-cloud c3" />
      {SPARKLES.map((s, i) => (
        <span key={i} className="sky-sparkle" style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}>
          ✦
        </span>
      ))}
    </div>
  );
}
