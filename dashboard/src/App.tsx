import { useState } from 'react';
import { SharedDefs } from '../../client/src/avatar/SharedDefs.tsx';
import { api, useLoad } from './api.ts';
import { when } from './format.ts';
import { Activity } from './sections/Activity.tsx';
import { AddSub } from './sections/AddSub.tsx';
import { Coins } from './sections/Coins.tsx';
import { Kpis } from './sections/Kpis.tsx';
import { Sessions } from './sections/Sessions.tsx';
import { Tables } from './sections/Tables.tsx';
import { Tricky } from './sections/Tricky.tsx';

const PERIODS = [
  { days: 7, label: '7 dagen', versus: 'de 7 dagen ervoor' },
  { days: 30, label: '30 dagen', versus: 'de 30 dagen ervoor' },
  { days: 90, label: '90 dagen', versus: 'de 90 dagen ervoor' },
  { days: 0, label: 'Alles', versus: '' },
];

function remembered(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function remember(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Only a convenience.
  }
}

/** How Nomi is doing: one page, one period and player picker above everything. */
export function App() {
  const players = useLoad(() => api.players(), []);
  const [chosen, setChosen] = useState(() => remembered('dashboard.player', ''));
  const [days, setDays] = useState(() => Number(remembered('dashboard.days', '30')));
  const list = players.data ?? [];
  const player = list.find((p) => p.name === chosen)?.name ?? list[0]?.name;

  const overview = useLoad(() => (player ? api.overview(player, days) : Promise.resolve(undefined)), [player, days]);
  const sessions = useLoad(() => (player ? api.sessions(player, days) : Promise.resolve(undefined)), [player, days]);
  const coins = useLoad(() => (player ? api.coins(player, days) : Promise.resolve(undefined)), [player, days]);
  const period = PERIODS.find((p) => p.days === days) ?? PERIODS[1];
  const loading = overview.loading || sessions.loading || coins.loading;
  const error = players.error ?? overview.error ?? sessions.error ?? coins.error;
  const o = overview.data;

  return (
    <div className="page">
      <SharedDefs />
      <header className="page-head">
        <h1 className="brand">
          <span className="rainbow" aria-hidden="true">
            {'Regenboog'.split('').map((ch, i) => (
              <span key={i} className={`r${i % 6}`}>
                {ch}
              </span>
            ))}
          </span>{' '}
          Rekenen <span className="brand-sub">{player ? `· ${player}` : ''}</span>
        </h1>
        {o?.lastPlayed && <p className="last-played">Laatst geoefend {when(o.lastPlayed)}</p>}
      </header>

      <div className="filters" role="toolbar" aria-label="Filters">
        {list.length > 1 && (
          <label className="field inline">
            <span>Kind</span>
            <select
              value={player}
              onChange={(e) => {
                setChosen(e.target.value);
                remember('dashboard.player', e.target.value);
              }}
            >
              {list.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
        )}
        <div className="segmented" role="group" aria-label="Periode">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              aria-pressed={p.days === days}
              onClick={() => {
                setDays(p.days);
                remember('dashboard.days', String(p.days));
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="banner">Kon de gegevens niet ophalen ({error.message}). Draait de database?</p>}
      {players.data && !list.length && <p className="banner">Nog geen gegevens: er is nog niet gerekend.</p>}

      {o && (
        <main className={`board${loading ? ' refreshing' : ''}`}>
          <Kpis now={o.kpis} before={o.previous} periodDays={days} balance={coins.data?.balance} versus={period.versus} />
          {!o.kpis.solved ? (
            <p className="banner wide">Geen sommen in deze periode.</p>
          ) : (
            <>
              <Activity overview={o} />
              <h2 className="section-title">Wat gaat goed, wat is lastig</h2>
              <Tables cells={o.tables.cells} tables={o.tables.tables} />
              <AddSub groups={o.addSub} />
              <Tricky mistakes={o.mistakes} slowest={o.slowest} />
            </>
          )}
          {coins.data && (
            <>
              <h2 className="section-title">Muntjes en winkel</h2>
              <Coins coins={coins.data} onGift={coins.reload} />
            </>
          )}
          {sessions.data && (
            <>
              <h2 className="section-title">Alle sessies</h2>
              <Sessions sessions={sessions.data} />
            </>
          )}
        </main>
      )}
    </div>
  );
}
