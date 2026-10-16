import { useState } from 'react';
import { CATALOG, decidePurchase, itemById } from '../../../shared/catalog.ts';
import { StageFigure } from '../avatar/StageFigure.tsx';
import { ASK_NAME } from '../config.ts';
import type { Player } from '../game/player.ts';
import { sound } from '../game/sound.ts';
import { load, save } from '../game/storage.ts';
import { HOUSES, thingPaint } from '../home/drawings.tsx';
import { Progress } from '../shop/BuyDialog.tsx';
import { ItemThumb } from '../shop/ItemThumb.tsx';
import { CoinBadge, coins } from './Coin.tsx';
import { MuteButton } from './MuteButton.tsx';

export type Destination = 'play' | 'wardrobe' | 'place';

const HOME_SLOTS = new Set(['land', 'house', 'garden']);

/** Where a shop item is sold. */
export function shopFor(itemId: string): Destination {
  return HOME_SLOTS.has(itemById(itemId)?.slot ?? '') ? 'place' : 'wardrobe';
}

/** What she says in the speech bubble. */
function greeting(player: Player): string {
  const { balance, earned } = player.profile;
  const goal = player.goal ? itemById(player.goal) : undefined;
  if (goal && balance >= goal.price) return `Je hebt genoeg voor je ${goal.name.toLowerCase()}! 🎉`;
  if (earned === 0 && balance === 0) return 'Elke goede som is een muntje!';
  if (goal) return `Nog ${coins(goal.price - balance)} voor je wens!`;
  const affordable = CATALOG.some((i) => !i.stackable && decidePurchase(i.id, player.profile.owned, balance) === 'ok');
  if (affordable) return 'Je kunt iets nieuws kopen!';
  return 'Zullen we gaan rekenen?';
}

/** The start screen: her character, her coins and where to go. */
export function Home({
  player,
  onGo,
  onSwitchPlayer,
}: {
  player: Player;
  onGo: (to: Destination, focus?: string) => void;
  onSwitchPlayer: () => void;
}) {
  const go = (to: Destination, focus?: string) => {
    sound.tap();
    onGo(to, focus);
  };
  const look = player.look;
  const house = player.home.house ? HOUSES[player.home.house] : null;
  const goal = player.goal ? itemById(player.goal) : undefined;

  return (
    <div className="home screen">
      <div className="home-corner">
        <MuteButton />
      </div>

      <section className={`home-stage${house ? ' has-house' : ''}`}>
        {house && (
          <svg className="home-house" viewBox={`0 0 ${house.w} ${house.h}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            {house.draw(thingPaint(undefined))}
          </svg>
        )}
        <div className="home-hill" />
        <div className="speech">
          Hoi {player.name}! <span className="speech-line">{greeting(player)}</span>
        </div>
        <StageFigure look={look} />
      </section>

      <section className="home-panel">
        <h1 className="app-title small" aria-label="Regenboog Rekenen">
          {'Regenboog'.split('').map((ch, i) => (
            <span key={i} className={`t${i % 6}`}>
              {ch}
            </span>
          ))}{' '}
          <span className="title-plain">Rekenen</span>
        </h1>

        <CoinBadge value={player.profile.balance} big />

        {goal && (
          <button className="goal-card card" onClick={() => go(shopFor(goal.id), goal.id)}>
            <div className="goal-thumb">
              <ItemThumb id={goal.id} look={look} />
            </div>
            <div className="goal-info">
              <span className="goal-label">⭐ Mijn wens: {goal.name}</span>
              <Progress value={player.profile.balance} max={goal.price} />
              <span className="goal-left">
                {player.profile.balance >= goal.price ? 'Je kunt het kopen!' : `Nog ${coins(goal.price - player.profile.balance)}`}
              </span>
            </div>
          </button>
        )}

        <button className="big-btn home-play" onClick={() => go('play')}>
          Rekenen! 🌈
        </button>
        <div className="home-tiles">
          <button className="home-tile tile-wardrobe" onClick={() => go('wardrobe')}>
            <span className="home-tile-icon">👗</span>
            Aankleden
          </button>
          <button className="home-tile tile-place" onClick={() => go('place')}>
            <span className="home-tile-icon">🏡</span>
            Mijn plekje
          </button>
        </div>
        {ASK_NAME && (
          <button className="link-btn" onClick={onSwitchPlayer}>
            Ik ben niet {player.name}
          </button>
        )}
      </section>

      <GiftNotice player={player} />
    </div>
  );
}

/** Coins a parent gave her (see coin_gifts in the README): a surprise the first time she sees them. */
function GiftNotice({ player }: { player: Player }) {
  const key = `rekenen.giftSeen.${player.name}`;
  const [seen, setSeen] = useState(() => load<number>(key, 0));
  // On a new iPad, or after Safari cleared its storage, only gifts from the last two weeks show up again.
  const recent = Date.now() - 14 * 24 * 3600 * 1000;
  const gifts = player.profile.gifts.filter((g) => g.id > seen && g.amount > 0 && Date.parse(g.createdAt) > recent);
  if (!gifts.length) return null;

  const total = gifts.reduce((sum, g) => sum + g.amount, 0);
  const notes = gifts.map((g) => g.note).filter(Boolean);
  const close = () => {
    sound.buy();
    const last = Math.max(...player.profile.gifts.map((g) => g.id));
    save(key, last);
    setSeen(last);
  };
  return (
    <div className="overlay buy-overlay">
      <div className="buy-card gift-card" role="dialog" aria-label="Cadeautje">
        <div className="gift-icon">🎁</div>
        <h2 className="buy-title">Een cadeautje!</h2>
        <p className="buy-text strong">Je hebt {coins(total)} gekregen.</p>
        {notes.map((n, i) => (
          <p key={i} className="buy-text">
            “{n}”
          </p>
        ))}
        <div className="buy-buttons">
          <button className="big-btn" onClick={close}>
            Dankjewel! 💖
          </button>
        </div>
      </div>
    </div>
  );
}

/** Asked first when the app is set up for more than one child (ASK_NAME in config.ts). */
export function WhoAreYou({ initial, onName }: { initial: string; onName: (name: string) => void }) {
  const [name, setName] = useState(initial);
  const trimmed = name.trim();
  return (
    <div className="who screen">
      <section className="card name-card">
        <label className="card-title" htmlFor="name">
          {trimmed ? `Hoi ${trimmed}!` : 'Hoe heet je?'}
        </label>
        <input
          id="name"
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Typ je naam"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={30}
        />
        <button className="big-btn start-btn" disabled={!trimmed} onClick={() => onName(trimmed)}>
          {trimmed ? 'Verder! 🌈' : 'Typ eerst je naam ☝️'}
        </button>
      </section>
    </div>
  );
}
