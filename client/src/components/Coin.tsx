import type { Ref } from 'react';
import { starPath } from '../avatar/draw.tsx';

/** A golden coin with a star. One for every sum she solves. */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={`coin-icon${className ? ` ${className}` : ''}`} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx={20} cy={21} r={17.5} fill="#e09a00" />
      <circle cx={20} cy={19} r={17} fill="url(#gold)" stroke="#c98a00" strokeWidth={1.5} />
      <circle cx={20} cy={19} r={12.5} fill="none" stroke="#e0a800" strokeWidth={1.5} opacity={0.7} />
      <path d={starPath(20, 19.5, 8)} fill="#fff6c4" stroke="#e0a800" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M 9 13 Q 12 7 18 6" stroke="#fff" strokeWidth={2.5} opacity={0.75} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Her coin balance in a pill. Changing bump replays the little jump, e.g. when a coin lands.
 * ref: where flying coins aim for.
 */
export function CoinBadge({ value, bump, ref, big }: { value: number; bump?: number; ref?: Ref<HTMLDivElement>; big?: boolean }) {
  return (
    <div className={`coin-badge${big ? ' big' : ''}`} ref={ref} aria-label={`${value} muntjes`}>
      <CoinIcon key={bump} className={bump ? 'bump' : undefined} />
      <span className="coin-count">{value}</span>
    </div>
  );
}

/** "1 muntje", "5 muntjes". */
export function coins(n: number): string {
  return `${n} ${n === 1 ? 'muntje' : 'muntjes'}`;
}
