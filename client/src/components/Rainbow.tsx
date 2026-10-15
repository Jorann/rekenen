const ARCS = ['#ff5e7e', '#ff9f43', '#ffd93d', '#6bcb77', '#4d96ff', '#9b5de5'];

const CLOUD = [
  [0, 0, 9],
  [9, -5, 10],
  [19, -1, 9],
  [27, 2, 7],
  [-8, 3, 7],
] as const;

function Cloud({ x, y }: { x: number; y: number }) {
  return (
    <g className="cloud" fill="#fff">
      {CLOUD.map(([dx, dy, r], i) => (
        <circle key={i} cx={x + dx} cy={y + dy} r={r} />
      ))}
    </g>
  );
}

/** A rainbow that draws itself, optionally with a unicorn galloping over the top. */
export function Rainbow({ rider = false, loop = false }: { rider?: boolean; loop?: boolean }) {
  return (
    <div className="rainbow">
      <svg viewBox="0 0 200 112" aria-hidden="true">
        {ARCS.map((color, i) => {
          const r = 92 - i * 10;
          const length = Math.PI * r;
          return (
            <path
              key={color}
              className="arc"
              d={`M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100`}
              stroke={color}
              strokeWidth={10.5}
              fill="none"
              style={{ strokeDasharray: length, strokeDashoffset: length, animationDelay: `${i * 0.12}s` }}
            />
          );
        })}
        <Cloud x={14} y={100} />
        <Cloud x={164} y={100} />
      </svg>
      {rider && (
        <div className={`rider-arm${loop ? ' loop' : ''}`}>
          <span className="rider">🦄</span>
        </div>
      )}
    </div>
  );
}
