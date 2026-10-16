import { useState } from 'react';
import { barPath, useWidth } from './scale.ts';
import { Tooltip, type TipRow } from './Tooltip.tsx';

export interface HBar {
  label: string;
  value: number | null;
  color: string;
  tip: TipRow[];
}

const ROW = 30;
const BAR = 14;

/** Horizontal bars with the value at the tip. Rows without data say so instead of drawing nothing. */
export function HBars({ rows, max, format, labelWidth = 150, empty = 'nog niet geoefend' }: { rows: HBar[]; max: number; format: (v: number) => string; labelWidth?: number; empty?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const valueWidth = 56;
  const barArea = Math.max(0, width - labelWidth - valueWidth);
  const height = rows.length * ROW + 4;

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Staafdiagram" onPointerLeave={() => setActive(null)}>
          <line className="axis" x1={labelWidth} x2={labelWidth} y1={0} y2={height} />
          {rows.map((r, i) => {
            const cy = i * ROW + ROW / 2 + 2;
            const w = r.value == null ? 0 : Math.max(2, (r.value / max) * barArea);
            return (
              <g key={r.label} className={active != null && active !== i ? 'dim' : undefined} onPointerEnter={() => setActive(i)}>
                <rect x={0} y={cy - ROW / 2} width={width} height={ROW} fill="transparent" />
                <text className="row-label" x={labelWidth - 10} y={cy} dy="0.32em" textAnchor="end">
                  {r.label}
                </text>
                {r.value != null && <path d={barPath(labelWidth, cy - BAR / 2, w, BAR, true)} style={{ fill: r.color }} />}
                <text className={r.value == null ? 'tick' : 'value-label'} x={labelWidth + w + 8} y={cy} dy="0.32em">
                  {r.value == null ? empty : format(r.value)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {active != null && rows[active].tip.length > 0 && (
        <Tooltip x={labelWidth + 40} y={active * ROW + 4} width={width} title={rows[active].label} rows={rows[active].tip} />
      )}
    </div>
  );
}
