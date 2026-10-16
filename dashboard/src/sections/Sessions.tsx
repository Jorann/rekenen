import { useEffect, useState } from 'react';
import type { SessionDetail, SessionSummary } from '../../server/stats.ts';
import { api, useLoad } from '../api.ts';
import { duration, num, OP_SYMBOL, pct, secs, sumText, when } from '../format.ts';

function what(s: SessionSummary): string {
  const ops = s.operations.map((op) => OP_SYMBOL[op]).join(' ');
  const parts = [ops];
  if (s.operations.some((op) => op !== 'mul') && s.settings.maxNumber) parts.push(`tot ${s.settings.maxNumber}`);
  const tables = s.settings.tables;
  if (s.operations.includes('mul') && tables && tables.length < 10) parts.push(`tafels ${tables.join(', ')}`);
  return parts.join(' · ');
}

/** Every practice session; click one to see each sum and every answer she gave. */
export function Sessions({ sessions }: { sessions: SessionSummary[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="card wide">
      <header className="card-head">
        <div>
          <h2 className="card-title">Sessies</h2>
          <p className="card-sub">Klik op een sessie voor alle sommen en antwoorden</p>
        </div>
      </header>
      {sessions.length ? (
        <div className="table-scroll">
          <table className="data-table clickable">
            <thead>
              <tr>
                <th>Wanneer</th>
                <th>Oefening</th>
                <th className="num">Sommen</th>
                <th className="num">In één keer goed</th>
                <th className="num">Tijd per som</th>
                <th className="num">Geoefend</th>
                <th>Klaar</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} tabIndex={0} onClick={() => setOpen(s.id)} onKeyDown={(e) => e.key === 'Enter' && setOpen(s.id)}>
                  <td>{when(s.startedAt)}</td>
                  <td>{what(s)}</td>
                  <td className="num">
                    {num(s.solved)} <span className="muted">van {num(s.questionsPerRound * s.roundsTotal)}</span>
                  </td>
                  <td className="num">{pct(s.solved ? s.firstTry / s.solved : null)}</td>
                  <td className="num">{secs(s.medianMs)}</td>
                  <td className="num">{duration(s.activeMs)}</td>
                  <td>{s.finishedAt ? '✓' : <span className="muted">gestopt</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Geen sessies in deze periode.</p>
      )}
      {open && <SessionDialog id={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function SessionDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useLoad(() => api.session(id), [id]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  const rounds = new Map<number, SessionDetail['sums']>();
  for (const s of data?.sums ?? []) rounds.set(s.roundNumber, [...(rounds.get(s.roundNumber) ?? []), s]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="card dialog" role="dialog" aria-modal="true" aria-label="Sessie" onClick={(e) => e.stopPropagation()}>
        <header className="card-head">
          <div>
            <h2 className="card-title">{data ? `Sessie van ${when(data.startedAt)}` : 'Sessie'}</h2>
            {data && (
              <p className="card-sub">
                {what(data)} · {num(data.solved)} sommen · {pct(data.solved ? data.firstTry / data.solved : null)} in één keer goed · {duration(data.activeMs)}
              </p>
            )}
          </div>
          <button className="ghost-btn" onClick={onClose} autoFocus>
            Sluiten
          </button>
        </header>
        {!data ? (
          <p className="empty">Laden…</p>
        ) : (
          [...rounds.entries()].map(([round, sums]) => (
            <div key={round} className="round">
              <h3 className="round-title">Ronde {round}</h3>
              <table className="data-table">
                <tbody>
                  {sums.map((s) => (
                    <tr key={s.position}>
                      <td className="sum-cell">
                        {sumText(s.op, s.a, s.b)} = {s.answer}
                      </td>
                      <td>
                        {s.attempts.map((a, i) => (
                          <span key={i} className={a.isCorrect ? 'attempt right' : 'attempt wrong'}>
                            {a.answer}
                          </span>
                        ))}
                      </td>
                      <td className="num">{secs(s.durationMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
