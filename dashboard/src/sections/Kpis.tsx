import type { Kpis as KpiNumbers } from '../../server/stats.ts';
import { duration, num, pct, secs } from '../format.ts';

interface Delta {
  text: string;
  good: boolean | null;
}

/** "▲ 12% meer", "▼ 0,4 s sneller": direction, size and whether that is good news. */
function change(now: number | null, before: number | null, kind: 'count' | 'share' | 'time'): Delta | null {
  if (now == null || before == null) return null;
  if (kind === 'share') {
    const points = Math.round((now - before) * 100);
    if (points === 0) return { text: 'gelijk', good: null };
    return { text: `${points > 0 ? '▲' : '▼'} ${Math.abs(points)} procentpunt`, good: points > 0 };
  }
  if (kind === 'time') {
    const diff = now - before;
    if (Math.abs(diff) < 100) return { text: 'even snel', good: null };
    return { text: `${diff < 0 ? '▼' : '▲'} ${secs(Math.abs(diff))} ${diff < 0 ? 'sneller' : 'langzamer'}`, good: diff < 0 };
  }
  if (before === 0) return now > 0 ? { text: `▲ ${num(now)} meer`, good: true } : null;
  const rel = Math.round(((now - before) / before) * 100);
  if (rel === 0) return { text: 'gelijk', good: null };
  return { text: `${rel > 0 ? '▲' : '▼'} ${Math.abs(rel)}% ${rel > 0 ? 'meer' : 'minder'}`, good: rel > 0 };
}

function Tile({ label, value, delta, note }: { label: string; value: string; delta?: Delta | null; note?: string }) {
  return (
    <div className="card stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {delta ? (
        <span className={`stat-delta${delta.good === true ? ' good' : ''}`}>{delta.text}</span>
      ) : note ? (
        <span className="stat-delta">{note}</span>
      ) : null}
    </div>
  );
}

/** The headline numbers for the period, compared with the period before it. */
export function Kpis({ now, before, periodDays, balance, versus }: { now: KpiNumbers; before: KpiNumbers | null; periodDays: number; balance?: number; versus: string }) {
  return (
    <section className="kpis" aria-label={`Kerncijfers, vergeleken met ${versus}`}>
      <Tile label="Sommen gemaakt" value={num(now.solved)} delta={change(now.solved, before?.solved ?? null, 'count')} />
      <Tile label="Geoefend" value={duration(now.activeMs)} delta={change(now.activeMs, before?.activeMs ?? null, 'count')} />
      <Tile label="In één keer goed" value={pct(now.firstTry)} delta={change(now.firstTry, before?.firstTry ?? null, 'share')} />
      <Tile label="Tijd per som" value={secs(now.medianMs)} delta={change(now.medianMs, before?.medianMs ?? null, 'time')} note="mediaan" />
      <Tile
        label="Dagen geoefend"
        value={periodDays ? `${now.daysPractised} van ${periodDays}` : num(now.daysPractised)}
        delta={change(now.daysPractised, before?.daysPractised ?? null, 'count')}
      />
      {balance != null && <Tile label="Muntjes" value={num(balance)} note="nu te besteden" />}
    </section>
  );
}
