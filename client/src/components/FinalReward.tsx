import { useEffect, useState } from 'react';
import { sound } from '../game/sound.ts';
import { grandFinale } from './effects.ts';
import { Rainbow } from './Rainbow.tsx';

export interface GameStats {
  solved: number;
  firstTry: number;
  rounds: number;
}

const FLOATERS = ['🦄', '🌈', '⭐', '💖', '✨', '🦄', '🌟', '💜', '🌈', '⭐', '🦄', '💖'];

/** The big celebration after the last round. */
export function FinalReward({
  name,
  stats,
  onAgain,
  onHome,
}: {
  name: string;
  stats: GameStats;
  onAgain: () => void;
  onHome: () => void;
}) {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    sound.final();
    const stop = grandFinale();
    const t = setTimeout(() => setShowButtons(true), 2500);
    return () => {
      stop();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="final-reward">
      <div className="floaters" aria-hidden="true">
        {FLOATERS.map((e, i) => (
          <span
            key={i}
            style={{ left: `${(i * 8.3 + 2) % 100}%`, animationDelay: `${i * 0.55}s`, animationDuration: `${6 + (i % 4)}s` }}
          >
            {e}
          </span>
        ))}
      </div>
      <span className="flying-unicorn" aria-hidden="true">
        🦄
      </span>

      <div className="final-content">
        <div className="final-rainbow">
          <Rainbow rider loop />
          <span className="trophy">🏆</span>
        </div>
        <h1 className="final-title">Hoera{name ? `, ${name}` : ''}!</h1>
        <p className="final-sub">
          {stats.rounds === 1 ? 'Helemaal klaar.' : `Alle ${stats.rounds} rondes klaar.`} Je bent een echte rekenkampioen!
        </p>
        <div className="final-stats">
          <div className="stat">
            <span className="stat-num">{stats.solved}</span>
            <span className="stat-label">sommen gemaakt</span>
          </div>
          <div className="stat">
            <span className="stat-num">{stats.firstTry} ⭐</span>
            <span className="stat-label">in één keer goed</span>
          </div>
        </div>
        <div className={`final-buttons${showButtons ? ' show' : ''}`}>
          <button className="big-btn" onClick={onAgain} disabled={!showButtons}>
            Nog een keer! 🔁
          </button>
          <button className="big-btn secondary" onClick={onHome} disabled={!showButtons}>
            Naar het begin 🏠
          </button>
        </div>
      </div>
    </div>
  );
}
