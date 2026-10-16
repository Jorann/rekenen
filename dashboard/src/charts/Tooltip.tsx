import type { ReactNode } from 'react';

export interface TipRow {
  /** Colour of the short line key, if the row belongs to a series. */
  color?: string;
  value: string;
  label: string;
}

/**
 * One tooltip for a chart: a title, then rows with the value first (strong) and its label after.
 * x, y are in the chart's own pixels. 'above' sits on top of a mark (heatmap cells); 'beside' sits next
 * to the crosshair, from the top of the plot down, so it never leaves the chart. It flips left near the right edge.
 */
export function Tooltip({
  x,
  y,
  width,
  title,
  rows,
  place = 'beside',
  children,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  rows: TipRow[];
  place?: 'above' | 'beside';
  children?: ReactNode;
}) {
  const flip = x > width - 200;
  return (
    <div
      className={`tooltip ${place}`}
      role="status"
      style={{ left: flip ? undefined : x + 14, right: flip ? width - x + 14 : undefined, top: place === 'above' ? Math.max(0, y - 10) : y }}
    >
      <div className="tooltip-title">{title}</div>
      {rows.map((r) => (
        <div className="tooltip-row" key={r.label}>
          {r.color && <span className="line-key" style={{ background: r.color }} />}
          <strong>{r.value}</strong>
          <span>{r.label}</span>
        </div>
      ))}
      {children}
    </div>
  );
}
