import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { barPath, labelEvery, niceTicks, useWidth } from './scale.ts';
import { Tooltip, type TipRow } from './Tooltip.tsx';

export interface Series {
  key: string;
  label: string;
  color: string;
}

const M = { top: 10, right: 8, bottom: 26, left: 36 };
const GAP = 2;

/** Stacked columns over time, one column per day or week. Hover or arrow keys show the numbers. */
export function Columns({
  data,
  series,
  xLabel,
  tipTitle,
  height = 220,
}: {
  data: { key: string; values: Record<string, number> }[];
  series: Series[];
  xLabel: (key: string) => string;
  tipTitle: (key: string) => string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0));
  const ticks = niceTicks(Math.max(1, ...totals));
  const top = ticks[ticks.length - 1];
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(24, band * 0.66));
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const every = labelEvery(data.length, plotW);

  function point(e: PointerEvent<SVGSVGElement>) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left - M.left;
    setActive(Math.max(0, Math.min(data.length - 1, Math.floor(x / band))));
  }

  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? data.length) - 1));
    else if (e.key === 'ArrowRight') setActive((a) => Math.min(data.length - 1, (a ?? -1) + 1));
    else return;
    e.preventDefault();
  }

  const tip: TipRow[] =
    active == null
      ? []
      : [
          ...series.map((s) => ({ color: s.color, value: String(data[active].values[s.key] ?? 0), label: s.label })),
          { value: String(totals[active]), label: 'samen' },
        ];

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          tabIndex={0}
          aria-label="Staafdiagram; pijltjestoetsen tonen de getallen per dag"
          onPointerMove={point}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? data.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={key}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="grid" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
              <text className="tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = M.left + i * band + (band - barW) / 2;
            let base = 0;
            const visible = series.filter((s) => (d.values[s.key] ?? 0) > 0);
            return (
              <g key={d.key} className={active != null && active !== i ? 'dim' : undefined}>
                {visible.map((s, j) => {
                  const v = d.values[s.key];
                  const y0 = y(base);
                  const y1 = y(base + v);
                  base += v;
                  const h = Math.max(0, y0 - y1 - (j > 0 ? GAP : 0));
                  const isTop = j === visible.length - 1;
                  return isTop ? (
                    <path key={s.key} d={barPath(x, y1, barW, h)} style={{ fill: s.color }} />
                  ) : (
                    <rect key={s.key} x={x} y={y1} width={barW} height={h} style={{ fill: s.color }} />
                  );
                })}
                {(data.length - 1 - i) % every === 0 && (
                  <text className="tick" x={M.left + (i + 0.5) * band} y={height - 8} textAnchor="middle">
                    {xLabel(d.key)}
                  </text>
                )}
              </g>
            );
          })}
          <line className="axis" x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
        </svg>
      )}
      {active != null && <Tooltip x={M.left + (active + 0.5) * band} y={M.top} width={width} title={tipTitle(data[active].key)} rows={tip} />}
    </div>
  );
}
