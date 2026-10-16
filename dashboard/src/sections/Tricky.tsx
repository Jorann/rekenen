import type { Mistake, SlowSum } from '../../server/stats.ts';
import { DataTable } from '../charts/ChartCard.tsx';
import { num, pct, secs, sumText } from '../format.ts';

/** The sums to practise: her most common wrong answers, and the times-table sums that take longest. */
export function Tricky({ mistakes, slowest }: { mistakes: Mistake[]; slowest: SlowSum[] }) {
  return (
    <>
      <section className="card">
        <header className="card-head">
          <div>
            <h2 className="card-title">Vaakst fout</h2>
            <p className="card-sub">Het foute antwoord dat ze het vaakst gaf</p>
          </div>
        </header>
        {mistakes.length ? (
          <DataTable
            head={['Som', 'Fout antwoord', 'Goed', 'Keer']}
            numeric={[1, 2, 3]}
            rows={mistakes.map((m) => [sumText(m.op, m.a, m.b), <span className="wrong">{m.wrongAnswer}</span>, answer(m), num(m.count)])}
          />
        ) : (
          <p className="empty">Geen foute antwoorden in deze periode. Knap!</p>
        )}
      </section>
      <section className="card">
        <header className="card-head">
          <div>
            <h2 className="card-title">Langzaamste tafelsommen</h2>
            <p className="card-sub">Sommen die ze minstens twee keer deed, langzaamste eerst</p>
          </div>
        </header>
        {slowest.length ? (
          <DataTable
            head={['Som', 'Tijd per som', 'In één keer goed', 'Keer']}
            numeric={[1, 2, 3]}
            rows={slowest.map((s) => [`${sumText(s.op, s.a, s.b)} = ${s.a * s.b}`, secs(s.medianMs), pct(s.firstTry), num(s.n)])}
          />
        ) : (
          <p className="empty">Nog te weinig keersommen in deze periode.</p>
        )}
      </section>
    </>
  );
}

function answer(m: Mistake): number {
  return m.op === 'add' ? m.a + m.b : m.op === 'sub' ? m.a - m.b : m.a * m.b;
}
