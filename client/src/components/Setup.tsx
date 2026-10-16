import { useState } from 'react';
import type { GameSettings, Operation } from '../game/questions.ts';
import { sound } from '../game/sound.ts';
import { MuteButton } from './MuteButton.tsx';

const OPERATIONS: { op: Operation; symbol: string; label: string }[] = [
  { op: 'add', symbol: '+', label: 'Plus' },
  { op: 'sub', symbol: '−', label: 'Min' },
  { op: 'mul', symbol: '×', label: 'Keer' },
];
const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MAX_NUMBERS = [20, 50, 100];

export const DEFAULT_SETTINGS: GameSettings = {
  operations: ['add'],
  maxNumber: 100,
  tables: ALL_TABLES,
  questionsPerRound: 5,
  rounds: 3,
};

/** What to practise: the parent (or Nomi) picks the kind of sums before a game. */
export function Setup({
  initialSettings,
  onStart,
  onBack,
}: {
  initialSettings: GameSettings;
  onStart: (settings: GameSettings) => void;
  onBack: () => void;
}) {
  const [s, setS] = useState(initialSettings);
  const update = (patch: Partial<GameSettings>) => setS((prev) => ({ ...prev, ...patch }));

  const toggleOp = (op: Operation) => {
    const on = s.operations.includes(op);
    if (on && s.operations.length === 1) return; // at least one kind of sum
    update({ operations: on ? s.operations.filter((o) => o !== op) : OPERATIONS.map((o) => o.op).filter((o) => o === op || s.operations.includes(o)) });
  };

  const toggleTable = (t: number) => {
    const on = s.tables.includes(t);
    if (on && s.tables.length === 1) return; // at least one table
    update({ tables: on ? s.tables.filter((x) => x !== t) : [...s.tables, t].sort((a, b) => a - b) });
  };

  const hasAddSub = s.operations.includes('add') || s.operations.includes('sub');
  const hasMul = s.operations.includes('mul');
  const allTables = s.tables.length === ALL_TABLES.length;

  return (
    <div className="setup">
      <div className="setup-corner">
        <button
          className="icon-btn"
          onClick={() => {
            sound.tap();
            onBack();
          }}
          aria-label="Naar huis"
        >
          🏠
        </button>
        <MuteButton />
      </div>

      <header className="setup-header">
        <h1 className="app-title" aria-label="Regenboog Rekenen">
          {'Regenboog'.split('').map((ch, i) => (
            <span key={i} className={`t${i % 6}`}>
              {ch}
            </span>
          ))}
          <br />
          <span className="title-plain">Rekenen</span>
        </h1>
        <div className="mascot" aria-hidden="true">
          🦄
        </div>
      </header>

      <section className="card ops-card">
        <h2 className="card-title">Wat gaan we oefenen?</h2>
        <div className="op-tiles">
          {OPERATIONS.map(({ op, symbol, label }) => {
            const on = s.operations.includes(op);
            return (
              <button key={op} className={`op-tile op-${op}${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleOp(op)}>
                <span className="op-symbol">{symbol}</span>
                <span className="op-label">{label}</span>
              </button>
            );
          })}
        </div>

        {hasAddSub && (
          <div className="option-row">
            <span className="option-label">Plus en min tot</span>
            <div className="chips">
              {MAX_NUMBERS.map((n) => (
                <button key={n} className={`chip${s.maxNumber === n ? ' on' : ''}`} aria-pressed={s.maxNumber === n} onClick={() => update({ maxNumber: n })}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMul && (
          <div className="option-row stacked">
            <span className="option-label">Welke tafels?</span>
            <div className="chips">
              {ALL_TABLES.map((t) => (
                <button key={t} className={`chip round${s.tables.includes(t) ? ' on' : ''}`} aria-pressed={s.tables.includes(t)} onClick={() => toggleTable(t)}>
                  {t}
                </button>
              ))}
              <button className={`chip${allTables ? ' on' : ''}`} aria-pressed={allTables} onClick={() => update({ tables: ALL_TABLES })}>
                Alle
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card counts">
        <Stepper label="Sommen per ronde" value={s.questionsPerRound} min={1} max={20} onChange={(v) => update({ questionsPerRound: v })} />
        <Stepper label="Rondes" value={s.rounds} min={1} max={10} onChange={(v) => update({ rounds: v })} />
      </section>

      <button className="big-btn start-btn" onClick={() => onStart(s)}>
        Start! 🌈
      </button>
    </div>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <span className="option-label">{label}</span>
      <div className="stepper-controls">
        <button className="step-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${label} minder`}>
          −
        </button>
        <span className="step-value">{value}</span>
        <button className="step-btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${label} meer`}>
          +
        </button>
      </div>
    </div>
  );
}
