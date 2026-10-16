import { useState } from 'react';
import type { TableCell, TableRow } from '../../server/stats.ts';
import { ChartCard, DataTable } from '../charts/ChartCard.tsx';
import { HBars } from '../charts/HBars.tsx';
import { Tooltip } from '../charts/Tooltip.tsx';
import { OP_COLOR, SEQ } from '../colors.ts';
import { num, pct, secs } from '../format.ts';

type Metric = 'time' | 'firstTry';

/** Five steps, light (easy) to dark (hard): more would be too close to tell apart. */
const TIME_STEPS = [2500, 4000, 6000, 9000];
const TIME_LABELS = ['< 2,5 s', '2,5–4 s', '4–6 s', '6–9 s', '> 9 s'];
const FIRST_TRY_STEPS = [0.9, 0.75, 0.6, 0.45];
const FIRST_TRY_LABELS = ['≥ 90%', '75–90%', '60–75%', '45–60%', '< 45%'];

function step(cell: TableCell, metric: Metric): number | null {
  if (!cell.n) return null;
  if (metric === 'time') {
    const i = TIME_STEPS.findIndex((t) => cell.medianMs! < t);
    return i === -1 ? TIME_STEPS.length : i;
  }
  const i = FIRST_TRY_STEPS.findIndex((t) => cell.firstTry! >= t);
  return i === -1 ? FIRST_TRY_STEPS.length : i;
}

const TABLES = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * The times tables as a 10 × 10 grid: one cell per sum (a × b, row = the table b), darker = harder.
 * Next to it, how each table goes as a whole.
 */
export function Tables({ cells, tables }: { cells: TableCell[]; tables: TableRow[] }) {
  const [metric, setMetric] = useState<Metric>('time');
  const [active, setActive] = useState<TableCell | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0, width: 0 });
  const practised = cells.some((c) => c.n);
  const labels = metric === 'time' ? TIME_LABELS : FIRST_TRY_LABELS;

  function show(cell: TableCell, el: HTMLElement) {
    const grid = el.closest('.heatmap')!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setTip({ x: r.left - grid.left + r.width / 2, y: r.top - grid.top, width: grid.width });
    setActive(cell);
  }

  return (
    <>
      <ChartCard
        title="Tafels"
        subtitle={metric === 'time' ? 'Tijd per som (mediaan): hoe sterker de kleur, hoe langer ze erover doet' : 'In één keer goed: hoe sterker de kleur, hoe vaker eerst fout'}
        actions={
          <div className="segmented" role="group" aria-label="Wat de kleur laat zien">
            <button aria-pressed={metric === 'time'} onClick={() => setMetric('time')}>
              Tijd
            </button>
            <button aria-pressed={metric === 'firstTry'} onClick={() => setMetric('firstTry')}>
              Goed
            </button>
          </div>
        }
        table={
          <DataTable
            head={['Som', 'Keer geoefend', 'In één keer goed', 'Tijd per som']}
            numeric={[1, 2, 3]}
            rows={cells.filter((c) => c.n).map((c) => [`${c.a} × ${c.b}`, c.n, pct(c.firstTry), secs(c.medianMs)])}
          />
        }
      >
        {!practised ? (
          <p className="empty">Geen keersommen in deze periode.</p>
        ) : (
          <>
            <div className="heatmap" onPointerLeave={() => setActive(null)}>
              <span className="heat-corner">tafel</span>
              {TABLES.map((a) => (
                <span key={`c${a}`} className="heat-col">
                  {a} ×
                </span>
              ))}
              {TABLES.map((b) => (
                <div className="heat-row" key={b}>
                  <span className="heat-head">{b}</span>
                  {TABLES.map((a) => {
                    const cell = cells.find((c) => c.a === a && c.b === b)!;
                    const s = step(cell, metric);
                    return (
                      <button
                        key={a}
                        className={`heat-cell${s == null ? ' none' : ''}${active === cell ? ' on' : ''}`}
                        style={s == null ? undefined : { background: SEQ[s] }}
                        aria-label={`${a} × ${b}: ${cell.n ? `${pct(cell.firstTry)} in één keer goed, ${secs(cell.medianMs)}` : 'niet geoefend'}`}
                        onPointerEnter={(e) => show(cell, e.currentTarget)}
                        onFocus={(e) => show(cell, e.currentTarget)}
                        onBlur={() => setActive(null)}
                      />
                    );
                  })}
                </div>
              ))}
              {active && (
                <Tooltip
                  place="above"
                  x={tip.x}
                  y={tip.y}
                  width={tip.width}
                  title={`${active.a} × ${active.b} = ${active.a * active.b}`}
                  rows={
                    active.n
                      ? [
                          { value: secs(active.medianMs), label: 'per som' },
                          { value: pct(active.firstTry), label: 'in één keer goed' },
                          { value: num(active.n), label: 'keer geoefend' },
                        ]
                      : [{ value: '–', label: 'nog niet geoefend' }]
                  }
                />
              )}
            </div>
            <ul className="scale-legend" aria-label="Kleurschaal">
              {labels.map((l, i) => (
                <li key={l}>
                  <span className="rect-key" style={{ background: SEQ[i] }} />
                  {l}
                </li>
              ))}
              <li>
                <span className="rect-key none" />
                niet geoefend
              </li>
            </ul>
          </>
        )}
      </ChartCard>

      <ChartCard
        title="Per tafel"
        subtitle="In één keer goed"
        table={
          <DataTable
            head={['Tafel', 'Sommen', 'In één keer goed', 'Tijd per som']}
            numeric={[1, 2, 3]}
            rows={tables.map((t) => [`tafel van ${t.table}`, t.n, pct(t.firstTry), secs(t.medianMs)])}
          />
        }
      >
        <HBars
          labelWidth={110}
          max={1}
          format={(v) => pct(v)}
          rows={tables.map((t) => ({
            label: `tafel van ${t.table}`,
            value: t.firstTry,
            color: OP_COLOR.mul,
            tip: t.n
              ? [
                  { value: pct(t.firstTry), label: 'in één keer goed' },
                  { value: secs(t.medianMs), label: 'per som' },
                  { value: num(t.n), label: 'sommen' },
                ]
              : [],
          }))}
        />
      </ChartCard>
    </>
  );
}
