import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { labelEvery, niceTicks, useWidth } from './scale.ts';
import { Tooltip, type TipRow } from './Tooltip.tsx';

const M = { top: 12, right: 52, bottom: 26, left: 40 };

/**
 * One measure over time. Days without practice have no value; the line connects the days she did practise.
 * A crosshair follows the pointer (or the arrow keys) and shows the numbers of that day.
 */
export function LineChart({
  data,
  color,
  format,
  tickFormat = format,
  max,
  xLabel,
  tipTitle,
  tipRows,
  height = 190,
}: {
  data: { key: string; value: number | null }[];
  color: string;
  format: (v: number) => string;
  tickFormat?: (v: number) => string;
  /** A fixed top of the scale, e.g. 1 for 100%. */
  max?: number;
  xLabel: (key: string) => string;
  tipTitle: (key: string) => string;
  tipRows: (i: number) => TipRow[];
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const values = data.map((d) => d.value).filter((v): v is number => v != null);
  const ticks = max != null ? [0, max / 4, max / 2, (3 * max) / 4, max] : niceTicks(Math.max(1, ...values));
  const top = ticks[ticks.length - 1];
  const band = data.length ? plotW / data.length : 0;
  const x = (i: number) => M.left + (i + 0.5) * band;
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const every = labelEvery(data.length, plotW);
  const points = data.map((d, i) => (d.value == null ? null : { i, x: x(i), y: y(d.value) })).filter((p) => p != null);
  const path = points.map((p, n) => `${n ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const last = points.at(-1);

  function point(e: PointerEvent<SVGSVGElement>) {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left - M.left;
    setActive(Math.max(0, Math.min(data.length - 1, Math.floor(px / band))));
  }

  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? data.length) - 1));
    else if (e.key === 'ArrowRight') setActive((a) => Math.min(data.length - 1, (a ?? -1) + 1));
    else return;
    e.preventDefault();
  }

  const activeValue = active == null ? null : data[active].value;

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          tabIndex={0}
          aria-label="Lijngrafiek; pijltjestoetsen tonen de getallen per dag"
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
                {tickFormat(t)}
              </text>
            </g>
          ))}
          {data.map(
            (d, i) =>
              (data.length - 1 - i) % every === 0 && (
                <text key={d.key} className="tick" x={x(i)} y={height - 8} textAnchor="middle">
                  {xLabel(d.key)}
                </text>
              ),
          )}
          <line className="axis" x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
          {active != null && <line className="crosshair" x1={x(active)} x2={x(active)} y1={M.top} y2={y(0)} />}
          <path d={path} fill="none" style={{ stroke: color }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p) => (
            <circle key={p.i} className="dot" cx={p.x} cy={p.y} r={p.i === active ? 5.5 : 4} style={{ fill: color }} />
          ))}
          {last && (
            <text className="end-label" x={last.x + 9} y={last.y} dy="0.32em">
              {format(data[last.i].value!)}
            </text>
          )}
        </svg>
      )}
      {active != null && (
        <Tooltip x={x(active)} y={M.top} width={width} title={tipTitle(data[active].key)} rows={activeValue == null ? [{ value: '–', label: 'niet geoefend' }] : tipRows(active)} />
      )}
    </div>
  );
}
