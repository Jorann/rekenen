import { useEffect, useState } from 'react';
import { sound } from '../game/sound.ts';
import { roundBurst } from './effects.ts';
import { Rainbow } from './Rainbow.tsx';

const TITLES = ['Ronde klaar!', 'Goed gedaan!', 'Wat knap!', 'Je bent een ster!'];

/** Short celebration between rounds. Three variants take turns so it stays a surprise. */
export function RoundReward({ round, total, onNext }: { round: number; total: number; onNext: () => void }) {
  const [canContinue, setCanContinue] = useState(false);
  const variant = (round - 1) % 3;

  useEffect(() => {
    sound.round();
    roundBurst();
    // The button appears a moment later, so a fast tap on ✓ can't skip the celebration.
    const t = setTimeout(() => setCanContinue(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="overlay round-reward">
      <div className="reward-stage">
        {variant === 0 && <Rainbow rider />}
        {variant === 1 && <Balloons />}
        {variant === 2 && <SpinningStar />}
      </div>
      <h2 className="reward-title">{TITLES[(round - 1) % TITLES.length]}</h2>
      <p className="reward-sub">
        Ronde {round} van {total}
      </p>
      <div className="reward-stars" aria-label={`${round} van de ${total} rondes klaar`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < round ? 'on' : ''} style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
            ★
          </span>
        ))}
      </div>
      <button className={`big-btn next-btn${canContinue ? ' show' : ''}`} onClick={onNext} disabled={!canContinue}>
        Verder! 🦄
      </button>
    </div>
  );
}

function Balloons() {
  return (
    <div className="balloons" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="balloon"
          style={{
            left: `${6 + i * 11}%`,
            filter: `hue-rotate(${i * 40}deg)`,
            animationDelay: `${(i % 3) * 0.25 + i * 0.05}s`,
            animationDuration: `${2.6 + (i % 4) * 0.35}s`,
          }}
        >
          🎈
        </span>
      ))}
      <span className="bouncy-unicorn">🦄</span>
    </div>
  );
}

function SpinningStar() {
  return (
    <div className="star-show" aria-hidden="true">
      <span className="big-star">⭐</span>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="orbit" style={{ transform: `rotate(${i * 60}deg)` }}>
          <span className="orbit-sparkle">✨</span>
        </span>
      ))}
      <span className="peek-unicorn">🦄</span>
    </div>
  );
}
