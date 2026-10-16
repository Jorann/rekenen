import type { ReactNode } from 'react';
import { sound } from '../game/sound.ts';
import { CoinBadge } from './Coin.tsx';
import { MuteButton } from './MuteButton.tsx';

/** The bar at the top of the shop screens: home, a title and her coins. */
export function ScreenBar({ title, coins, onBack, children }: { title: string; coins: number; onBack: () => void; children?: ReactNode }) {
  return (
    <header className="screen-bar">
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
      <h1 className="screen-title">{title}</h1>
      <div className="screen-bar-right">
        {children}
        <CoinBadge value={coins} />
        <MuteButton />
      </div>
    </header>
  );
}
