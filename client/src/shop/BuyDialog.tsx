import { useEffect, useRef, useState } from 'react';
import { itemById } from '../../../shared/catalog.ts';
import { CoinIcon, coins } from '../components/Coin.tsx';
import { purchaseBurst } from '../components/effects.ts';
import type { Player } from '../game/player.ts';
import { sound } from '../game/sound.ts';
import { ItemThumb } from './ItemThumb.tsx';

/**
 * "Do you want to buy this?" A purchase always takes two taps (the item, then yes), so a stray tap
 * can't spend her savings. Without enough coins it shows how far she is, and she can make it her wish.
 */
export function BuyDialog({
  player,
  itemId,
  color,
  onClose,
  onBought,
}: {
  player: Player;
  itemId: string;
  color?: string;
  onClose: () => void;
  /** purchaseId: this purchase, e.g. to find a place for it in the garden. */
  onBought: (itemId: string, purchaseId: string) => void;
}) {
  const item = itemById(itemId)!;
  const [bought, setBought] = useState(false);
  const balance = player.profile.balance;
  const short = item.price - balance;
  const isGoal = player.goal === itemId;
  const thumbRef = useRef<HTMLDivElement>(null);
  const done = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Called after the celebration, by which time the purchase is in the profile: use the newest callback.
  const latestOnBought = useRef(onBought);
  latestOnBought.current = onBought;

  useEffect(() => () => clearTimeout(done.current), []);

  function buy() {
    const { decision, purchaseId } = player.buy(itemId);
    if (decision !== 'ok' || !purchaseId) {
      sound.nope();
      onClose();
      return;
    }
    sound.buy();
    purchaseBurst(thumbRef.current);
    setBought(true);
    done.current = setTimeout(() => latestOnBought.current(itemId, purchaseId), 1500);
  }

  function wish() {
    player.setGoal(isGoal ? null : itemId);
    sound.wear();
    onClose();
  }

  return (
    <div className="overlay buy-overlay" onClick={bought ? undefined : onClose}>
      <div className={`buy-card${bought ? ' bought' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={item.name}>
        <div className="buy-thumb" ref={thumbRef}>
          <ItemThumb id={itemId} look={player.look} color={color} />
        </div>
        <h2 className="buy-title">{item.name}</h2>

        {bought ? (
          <p className="buy-done">Gekocht! 🎉</p>
        ) : short > 0 ? (
          <>
            <p className="buy-text">
              Dit kost <Price n={item.price} />. Je hebt er nu {balance}.
            </p>
            <Progress value={balance} max={item.price} />
            <p className="buy-text strong">{isGoal ? `Dit is je wens! Nog ${coins(short)} sparen.` : `Nog ${coins(short)} sparen!`}</p>
            <div className="buy-buttons">
              {isGoal ? (
                <>
                  <button className="big-btn" onClick={onClose}>
                    Oké
                  </button>
                  <button className="big-btn secondary" onClick={wish}>
                    Geen wens meer
                  </button>
                </>
              ) : (
                <>
                  <button className="big-btn" onClick={wish}>
                    ⭐ Dit wil ik!
                  </button>
                  <button className="big-btn secondary" onClick={onClose}>
                    Oké
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="buy-text">
              Kopen voor <Price n={item.price} />?
            </p>
            <div className="buy-buttons">
              <button className="big-btn" onClick={buy}>
                Ja, kopen!
              </button>
              <button className="big-btn secondary" onClick={onClose}>
                Nee
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Price({ n }: { n: number }) {
  return (
    <span className="price">
      <CoinIcon />
      {n}
    </span>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
