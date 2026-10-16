import { useEffect, useRef, useState } from 'react';
import { CATALOG, itemById, type Item, type Slot } from '../../../shared/catalog.ts';
import { Avatar, type Mood } from '../avatar/Avatar.tsx';
import {
  CLOTH_COLORS,
  colorOf,
  EYE_COLORS,
  HAIR_STYLE_NAMES,
  HAIR_STYLES,
  recolor,
  SKIN_TONES,
  takeOff,
  wear,
  wornSlot,
  type Look,
} from '../avatar/look.ts';
import { StageFigure } from '../avatar/StageFigure.tsx';
import type { Player } from '../game/player.ts';
import { sound } from '../game/sound.ts';
import { load, save } from '../game/storage.ts';
import { BuyDialog, Price } from '../shop/BuyDialog.tsx';
import { ItemThumb } from '../shop/ItemThumb.tsx';
import { coins } from './Coin.tsx';
import { Loading } from './Loading.tsx';
import { ScreenBar } from './ScreenBar.tsx';

type TabId = 'me' | 'hair' | 'hat' | 'face' | 'clothes' | 'shoes' | 'extra' | 'pet';

const TABS: { id: TabId; label: string; icon: string; slots: Slot[] }[] = [
  { id: 'me', label: 'Ik', icon: '😊', slots: [] },
  { id: 'hair', label: 'Haar', icon: '💇‍♀️', slots: ['hairColor'] },
  { id: 'clothes', label: 'Kleren', icon: '👗', slots: ['top', 'dress', 'bottom'] },
  { id: 'hat', label: 'Hoofd', icon: '👑', slots: ['hat'] },
  { id: 'face', label: 'Brillen', icon: '🕶️', slots: ['face'] },
  { id: 'shoes', label: 'Schoenen', icon: '👟', slots: ['shoes'] },
  { id: 'extra', label: 'Extra', icon: '🎒', slots: ['neck', 'back', 'hand'] },
  { id: 'pet', label: 'Dieren', icon: '🐶', slots: ['pet'] },
];

const SLOT_TITLES: Partial<Record<Slot, string>> = {
  hairColor: 'Haarkleur',
  top: 'Shirts en truien',
  dress: 'Jurken',
  bottom: 'Broeken en rokjes',
  neck: 'Om je nek',
  back: 'Op je rug',
  hand: 'In je hand',
};

const TAB_KEY = 'rekenen.wardrobeTab';

function isWorn(look: Look, item: Item): boolean {
  if (item.slot === 'hairColor') return look.hairColor === item.id;
  const slot = wornSlot(item.id);
  return !!slot && look.worn[slot] === item.id;
}

function tabOf(itemId: string): TabId | undefined {
  const slot = itemById(itemId)?.slot;
  return TABS.find((t) => slot && t.slots.includes(slot))?.id;
}

/**
 * Dressing up: everything she owns, and everything in the shop to try on and buy.
 * focus: an item to open on, tried on if she doesn't have it yet (her wish, from the home screen).
 */
export function Wardrobe({ player, focus, onBack }: { player: Player; focus?: string; onBack: () => void }) {
  const [tab, setTab] = useState<TabId>(() => (focus && tabOf(focus)) || load<TabId>(TAB_KEY, 'clothes'));
  const [trying, setTrying] = useState<string | null>(() => (focus && !player.has(focus) ? focus : null));
  const [tryColors, setTryColors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(focus ?? null);
  const [buying, setBuying] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>('happy');
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(moodTimer.current), []);

  if (!player.profile.synced) return <Loading player={player} title="Aankleden" onBack={onBack} />;

  const saved = player.look;
  const shown = trying ? wear(recolor(saved, trying, tryColors[trying] ?? colorOf(saved, trying)), trying) : saved;
  const selectedItem = selected ? itemById(selected) : undefined;

  function cheer(ms = 1200) {
    setMood('joy');
    clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood('happy'), ms);
  }

  function update(look: Look) {
    player.saveLook(look);
  }

  function chooseTab(id: TabId) {
    sound.tap();
    setTab(id);
    save(TAB_KEY, id);
  }

  function tap(item: Item) {
    setSelected(item.id);
    if (!player.has(item.id)) {
      // Try it on first; buying is a separate step.
      sound.tap();
      setTrying(trying === item.id ? null : item.id);
      if (trying === item.id) setSelected(null);
      return;
    }
    setTrying(null);
    const slot = wornSlot(item.id);
    if (isWorn(saved, item) && slot) {
      const next = takeOff(saved, slot);
      if (next !== saved) {
        sound.tap();
        update(next);
      }
      return;
    }
    sound.wear();
    cheer();
    update(wear(saved, item.id));
  }

  function pickColor(color: string) {
    if (!selected) return;
    sound.tap();
    if (trying === selected) setTryColors({ ...tryColors, [selected]: color });
    else update(recolor(saved, selected, color));
  }

  function bought(itemId: string) {
    setBuying(null);
    setTrying(null);
    cheer(2000);
    const color = tryColors[itemId];
    update(wear(color ? recolor(saved, itemId, color) : saved, itemId));
  }

  const current = TABS.find((t) => t.id === tab)!;
  const showPalette = !!selectedItem?.colorable && (trying === selected || isWorn(saved, selectedItem));
  const selectedColor = selected ? (trying === selected ? (tryColors[selected] ?? colorOf(saved, selected)) : colorOf(saved, selected)) : undefined;

  return (
    <div className="wardrobe screen">
      <ScreenBar title="Aankleden" coins={player.profile.balance} onBack={onBack} />

      <div className="wardrobe-body">
        <section className="stage">
          <div className="stage-floor" />
          <StageFigure look={shown} mood={mood} />
          <TryBar
            player={player}
            trying={trying}
            selected={selectedItem}
            onBuy={() => trying && setBuying(trying)}
            onStop={() => {
              setTrying(null);
              setSelected(null);
            }}
          />
        </section>

        <section className="shelf">
          <nav className="tabs" aria-label="Soorten">
            {TABS.map((t) => (
              <button key={t.id} className={`tab${t.id === tab ? ' on' : ''}`} aria-pressed={t.id === tab} onClick={() => chooseTab(t.id)}>
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </nav>

          {showPalette && (
            <div className="palette" aria-label="Kleuren">
              {CLOTH_COLORS.map((c) => (
                <button
                  key={c}
                  className={`swatch${c === selectedColor ? ' on' : ''}`}
                  style={{ background: c }}
                  aria-label={`Kleur ${c}`}
                  aria-pressed={c === selectedColor}
                  onClick={() => pickColor(c)}
                />
              ))}
            </div>
          )}

          <div className="shelf-scroll">
            {tab === 'me' && (
              <MeChoices
                look={saved}
                onChange={(look) => {
                  sound.tap();
                  update(look);
                }}
              />
            )}
            {tab === 'hair' && (
              <div className="shelf-group">
                <h3 className="shelf-title">Kapsel</h3>
                <div className="item-grid">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style}
                      className={`item-card owned${saved.hair === style ? ' worn' : ''}`}
                      onClick={() => {
                        sound.wear();
                        cheer();
                        update({ ...saved, hair: style });
                      }}
                    >
                      <Avatar look={{ ...shown, hair: style, worn: { ...shown.worn, hat: undefined, face: undefined } }} viewBox="34 18 132 136" />
                      <span className="item-name">{HAIR_STYLE_NAMES[style]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {current.slots.map((slot) => (
              <div className="shelf-group" key={slot}>
                {(current.slots.length > 1 || SLOT_TITLES[slot]) && <h3 className="shelf-title">{SLOT_TITLES[slot]}</h3>}
                <div className="item-grid">
                  {CATALOG.filter((i) => i.slot === slot).map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      look={shown}
                      color={tryColors[item.id]}
                      owned={player.has(item.id)}
                      worn={isWorn(saved, item)}
                      trying={trying === item.id}
                      wished={player.goal === item.id}
                      onTap={() => tap(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {buying && (
        <BuyDialog player={player} itemId={buying} color={tryColors[buying]} onClose={() => setBuying(null)} onBought={bought} />
      )}
    </div>
  );
}

export function ItemCard({
  item,
  look,
  color,
  owned,
  worn,
  trying,
  wished,
  count,
  onTap,
}: {
  item: Item;
  look: Look;
  color?: string;
  owned: boolean;
  worn: boolean;
  trying?: boolean;
  wished: boolean;
  count?: number;
  onTap: () => void;
}) {
  return (
    <button className={`item-card${owned ? ' owned' : ''}${worn ? ' worn' : ''}${trying ? ' trying' : ''}`} onClick={onTap} aria-pressed={worn}>
      <ItemThumb id={item.id} look={look} color={color} />
      <span className="item-name">{item.name}</span>
      {owned && !item.stackable ? (
        <span className="item-tag">{worn ? 'Aan' : '✓'}</span>
      ) : (
        <span className="item-tag price-tag">
          <Price n={item.price} />
        </span>
      )}
      {count ? <span className="item-count">×{count}</span> : null}
      {wished && (
        <span className="wish-star" aria-label="Je wens">
          ⭐
        </span>
      )}
    </button>
  );
}

/** Under the avatar: what she is trying on and what it costs. */
function TryBar({ player, trying, selected, onBuy, onStop }: { player: Player; trying: string | null; selected?: Item; onBuy: () => void; onStop: () => void }) {
  if (!trying || !selected) {
    return (
      <div className="try-bar hint">
        {selected && player.has(selected.id) ? `${selected.name} is van jou 💖` : 'Tik op iets om het te passen!'}
      </div>
    );
  }
  const short = selected.price - player.profile.balance;
  return (
    <div className="try-bar">
      <div className="try-info">
        <span className="try-name">{selected.name}</span>
        <Price n={selected.price} />
      </div>
      <div className="try-actions">
        <button className="big-btn small" onClick={onBuy} aria-label={short > 0 ? `Nog ${coins(short)}` : 'Kopen'}>
          {short > 0 ? (
            <>
              Nog <Price n={short} />
            </>
          ) : (
            'Kopen! 🛍️'
          )}
        </button>
        <button className="icon-btn small" onClick={onStop} aria-label="Uitdoen">
          ✖️
        </button>
      </div>
    </div>
  );
}

/** Free choices: skin, eyes and freckles. */
function MeChoices({ look, onChange }: { look: Look; onChange: (look: Look) => void }) {
  return (
    <>
      <div className="shelf-group">
        <h3 className="shelf-title">Huidskleur</h3>
        <div className="swatch-row">
          {SKIN_TONES.map((c) => (
            <button key={c} className={`swatch big${look.skin === c ? ' on' : ''}`} style={{ background: c }} aria-label="Huidskleur" aria-pressed={look.skin === c} onClick={() => onChange({ ...look, skin: c })} />
          ))}
        </div>
      </div>
      <div className="shelf-group">
        <h3 className="shelf-title">Ogen</h3>
        <div className="swatch-row">
          {EYE_COLORS.map((c) => (
            <button key={c} className={`swatch big eye-swatch${look.eyes === c ? ' on' : ''}`} style={{ background: c }} aria-label="Oogkleur" aria-pressed={look.eyes === c} onClick={() => onChange({ ...look, eyes: c })} />
          ))}
        </div>
      </div>
      <div className="shelf-group">
        <h3 className="shelf-title">Sproetjes</h3>
        <div className="chips">
          <button className={`chip${look.freckles ? ' on' : ''}`} aria-pressed={look.freckles} onClick={() => onChange({ ...look, freckles: true })}>
            Ja
          </button>
          <button className={`chip${!look.freckles ? ' on' : ''}`} aria-pressed={!look.freckles} onClick={() => onChange({ ...look, freckles: false })}>
            Nee
          </button>
        </div>
      </div>
    </>
  );
}
