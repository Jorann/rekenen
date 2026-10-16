import { useEffect } from 'react';
import type { Player } from '../game/player.ts';
import { ScreenBar } from './ScreenBar.tsx';

/**
 * Shown by the shop screens until her coins, clothes and garden have come from the server once
 * (a new iPad, or Safari cleared its storage). Changing anything before that could overwrite
 * what the server has with the default look.
 */
export function Loading({ player, title, onBack }: { player: Player; title: string; onBack: () => void }) {
  const { refresh } = player;
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="screen loading">
      <ScreenBar title={title} coins={player.profile.balance} onBack={onBack} />
      <div className="loading-card card">
        <span className="loading-icon">🌈</span>
        <p className="loading-title">Even je spullen ophalen…</p>
        <p className="loading-text">Lukt het niet? Kijk of de wifi aan staat.</p>
      </div>
    </div>
  );
}
