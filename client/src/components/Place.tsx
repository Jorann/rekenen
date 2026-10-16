import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { CATALOG, itemById } from '../../../shared/catalog.ts';
import { Avatar } from '../avatar/Avatar.tsx';
import { heartPath } from '../avatar/draw.tsx';
import { Pet } from '../avatar/pets.tsx';
import type { Player } from '../game/player.ts';
import { sound } from '../game/sound.ts';
import { GARDEN, HOUSES, thingPaint } from '../home/drawings.tsx';
import type { HomeState, Spot } from '../home/home.ts';
import { BuyDialog, Price } from '../shop/BuyDialog.tsx';
import { coins } from './Coin.tsx';
import { Loading } from './Loading.tsx';
import { ScreenBar } from './ScreenBar.tsx';
import { ItemCard } from './Wardrobe.tsx';

/**
 * The garden, in garden units. Things stand with their feet somewhere inside AREA. The view starts at
 * the hills; houses and trees may reach up into the sky above it.
 */
const VIEW = '0 40 1000 600';
const AREA = { left: 70, right: 930, top: 275, bottom: 595 };
const HOUSE_AT = { x: 500, y: 262 };
const HOUSE_SCALE: Record<string, number> = { tent: 0.9, cabin: 0.8, cottage: 0.78, castle: 0.64 };
const GARDEN_COLORS = ['#ff5e7e', '#ff9f43', '#ffd93d', '#ff8fd8', '#9b5de5', '#74b9ff', '#ffffff'];

/** Things further back look smaller. */
function depth(y: number): number {
  return 0.7 + (0.5 * (y - AREA.top)) / (AREA.bottom - AREA.top);
}

function clamp(spot: Spot): Spot {
  return {
    ...spot,
    x: Math.round(Math.min(AREA.right, Math.max(AREA.left, spot.x))),
    y: Math.round(Math.min(AREA.bottom, Math.max(AREA.top, spot.y))),
  };
}

interface Placed {
  key: string;
  kind: 'thing' | 'me' | 'pet';
  itemId: string;
  spot: Spot;
}

/** Free places for new things, front and centre first. */
const CANDIDATES: Spot[] = (() => {
  const spots: Spot[] = [];
  for (let y = 545; y >= 320; y -= 56) {
    for (let i = 0; i < 9; i++) {
      const x = 500 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 95;
      spots.push({ x, y: y + (i % 3) * 8 });
    }
  }
  return spots;
})();

function freeSpot(taken: Spot[]): Spot {
  const free = CANDIDATES.find((c) => taken.every((t) => Math.hypot(t.x - c.x, (t.y - c.y) * 1.6) > 80));
  return free ?? { x: 300 + Math.round(Math.random() * 400), y: 480 + Math.round(Math.random() * 100) };
}

/** Everything in the garden: bought things, her pets and herself. Things without a saved spot get a free one. */
function layout(player: Player): Placed[] {
  const placed: Placed[] = [];
  const spots = player.home.spots;
  const taken: Spot[] = Object.values(spots);
  const add = (key: string, kind: Placed['kind'], itemId: string, fallback?: Spot) => {
    let spot = spots[key];
    if (!spot) {
      spot = fallback && taken.every((t) => Math.hypot(t.x - fallback.x, t.y - fallback.y) > 60) ? fallback : freeSpot(taken);
      taken.push(spot);
    }
    placed.push({ key, kind, itemId, spot });
  };
  add('me', 'me', 'me', { x: 410, y: 550 });
  let pets = 0;
  for (const p of player.profile.purchases) {
    const item = itemById(p.itemId);
    if (item?.slot === 'garden') add(p.id, 'thing', p.itemId);
    if (item?.slot === 'pet') add(`pet:${p.itemId}`, 'pet', p.itemId, { x: 320 - pets++ * 90, y: 575 });
  }
  return placed;
}

/**
 * Her own place: first a piece of land, then a house on it and a garden she arranges herself.
 * focus: an item to offer straight away (her wish, from the home screen).
 */
export function Place({ player, focus, onBack }: { player: Player; focus?: string; onBack: () => void }) {
  const hasLand = player.has('land');
  const [drawer, setDrawer] = useState<'house' | 'garden' | null>(null);
  const [buying, setBuying] = useState<string | null>(() => (focus && !(player.has(focus) && !itemById(focus)?.stackable) ? focus : null));
  const [fresh, setFresh] = useState<string | null>(null);
  const [moving, setMoving] = useState<Record<string, Spot>>({});
  const [hop, setHop] = useState<{ key: string; n: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  // The finger being dragged. The svg follows it (not the thing itself, which moves in the DOM as it is re-sorted).
  const drag = useRef<{ key: string; pointerId: number; offX: number; offY: number; startX: number; startY: number; moved: boolean; spot: Spot } | null>(
    null,
  );

  const placed = useMemo(() => layout(player), [player]);
  const home = player.home;

  if (!player.profile.synced) return <Loading player={player} title="Mijn plekje" onBack={onBack} />;

  function saveSpots(changes: Record<string, Spot>, extra?: Partial<HomeState>) {
    const spots = { ...home.spots };
    // Things that only had a temporary spot get it for good, so nothing jumps around later.
    for (const p of placed) spots[p.key] ??= p.spot;
    player.saveHome({ ...home, ...extra, spots: { ...spots, ...changes } });
  }

  function toGarden(e: ReactPointerEvent): { x: number; y: number } {
    const ctm = svg.current!.getScreenCTM()!.inverse();
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm);
    return { x: pt.x, y: pt.y };
  }

  function down(e: ReactPointerEvent, p: Placed) {
    if (drag.current) return; // one thing at a time
    svg.current!.setPointerCapture(e.pointerId);
    const pt = toGarden(e);
    drag.current = { key: p.key, pointerId: e.pointerId, offX: pt.x - p.spot.x, offY: pt.y - p.spot.y, startX: e.clientX, startY: e.clientY, moved: false, spot: p.spot };
  }

  function move(e: ReactPointerEvent) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 8) return;
    d.moved = true;
    const pt = toGarden(e);
    d.spot = clamp({ ...d.spot, x: pt.x - d.offX, y: pt.y - d.offY });
    setMoving({ [d.key]: d.spot });
  }

  /** The finger lifted (or the browser took it away): save where the thing ended up, or treat it as a tap. */
  function end(e: ReactPointerEvent, lifted: boolean) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    setMoving({});
    if (d.moved) {
      sound.tap();
      saveSpots({ [d.key]: d.spot });
      return;
    }
    const p = placed.find((x) => x.key === d.key);
    if (p && lifted) tap(p);
  }

  /** A tap: colourable things change colour, the rest give a little hop. */
  function tap(p: Placed) {
    const item = itemById(p.itemId);
    if (p.kind === 'thing' && item?.colorable) {
      const i = GARDEN_COLORS.indexOf(p.spot.color ?? GARDEN_COLORS[0]);
      sound.wear();
      saveSpots({ [p.key]: { ...p.spot, color: GARDEN_COLORS[(i + 1) % GARDEN_COLORS.length] } });
    } else {
      sound.tap();
    }
    setHop({ key: p.key, n: (hop?.n ?? 0) + 1 });
  }

  function toggleDrawer(kind: 'house' | 'garden') {
    sound.tap();
    setDrawer(drawer === kind ? null : kind);
  }

  function choose(itemId: string) {
    const item = itemById(itemId)!;
    if (item.slot === 'house' && player.has(itemId)) {
      sound.wear();
      saveSpots({}, { house: itemId });
      return;
    }
    if (!item.stackable && player.has(itemId)) {
      sound.tap();
      return;
    }
    sound.tap();
    setBuying(itemId);
  }

  function bought(itemId: string, purchaseId: string) {
    setBuying(null);
    const item = itemById(itemId)!;
    // Close the shop, so she sees the new thing appear.
    setDrawer(item.slot === 'land' ? 'house' : null);
    if (item.slot === 'land') return;
    if (item.slot === 'house') {
      saveSpots({}, { house: itemId });
      setFresh('house');
      return;
    }
    // Not there if the server already refused it.
    const purchase = player.profile.purchases.find((p) => p.id === purchaseId);
    if (!purchase) return;
    const spot = freeSpot(placed.map((p) => p.spot));
    saveSpots({ [purchase.id]: item.colorable ? { ...spot, color: GARDEN_COLORS[Math.floor(Math.random() * GARDEN_COLORS.length)] } : spot });
    setFresh(purchase.id);
  }

  const shown = placed.map((p) => ({ ...p, spot: moving[p.key] ?? p.spot })).sort((a, b) => a.spot.y - b.spot.y);
  const house = home.house ? HOUSES[home.house] : null;
  const shelf = CATALOG.filter((i) => i.slot === drawer);
  const counts = new Map<string, number>();
  for (const p of player.profile.purchases) counts.set(p.itemId, (counts.get(p.itemId) ?? 0) + 1);

  return (
    <div className="place screen">
      <ScreenBar title="Mijn plekje" coins={player.profile.balance} onBack={onBack} />

      <div className="garden">
        <svg
          ref={svg}
          className="garden-svg"
          viewBox={VIEW}
          preserveAspectRatio="xMidYMax meet"
          onPointerMove={move}
          onPointerUp={(e) => end(e, true)}
          onPointerCancel={(e) => end(e, false)}
          onLostPointerCapture={(e) => end(e, false)}
        >
          <Landscape hasLand={hasLand} />
          {house && home.house && (
            <g className={fresh === 'house' ? 'pop-in' : undefined} key={home.house}>
              <g transform={`translate(${HOUSE_AT.x} ${HOUSE_AT.y}) scale(${HOUSE_SCALE[home.house] ?? 0.85}) translate(${-house.w / 2} ${-house.h})`}>
                {house.draw(thingPaint(undefined))}
              </g>
            </g>
          )}
          {!hasLand && <ForSaleSign />}
          {hasLand &&
            shown.map((p) => (
              <g
                key={p.key}
                className={`garden-thing${moving[p.key] ? ' dragging' : ''}`}
                onPointerDown={(e) => down(e, p)}
              >
                <g transform={`translate(${p.spot.x} ${p.spot.y}) scale(${depth(p.spot.y)})`}>
                  <g className={`${fresh === p.key ? 'pop-in' : ''}${hop?.key === p.key ? ' hop' : ''}`} key={hop?.key === p.key ? hop.n : 0}>
                    <Figure placed={p} player={player} />
                  </g>
                </g>
              </g>
            ))}
          {!hasLand && (
            <g transform={`translate(380 590) scale(1.1)`}>
              <Figure placed={{ key: 'me', kind: 'me', itemId: 'me', spot: { x: 0, y: 0 } }} player={player} />
            </g>
          )}
        </svg>

        {!hasLand && <LandOffer player={player} onBuy={() => setBuying('land')} />}

        {hasLand && (
          <div className={`drawer${drawer ? ' open' : ''}`}>
            <div className="drawer-tabs">
              <button className={`tab${drawer === 'house' ? ' on' : ''}`} onClick={() => toggleDrawer('house')}>
                <span className="tab-icon">🏠</span>
                <span className="tab-label">Huisjes</span>
              </button>
              <button className={`tab${drawer === 'garden' ? ' on' : ''}`} onClick={() => toggleDrawer('garden')}>
                <span className="tab-icon">🌷</span>
                <span className="tab-label">Tuin</span>
              </button>
              {!drawer && <span className="drawer-hint">Sleep dingen om ze te verplaatsen</span>}
              {drawer && (
                <button className="icon-btn small drawer-close" onClick={() => setDrawer(null)} aria-label="Dicht">
                  ✖️
                </button>
              )}
            </div>
            {drawer && (
              <div className="drawer-items">
                {shelf.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    look={player.look}
                    owned={player.has(item.id)}
                    worn={item.slot === 'house' && home.house === item.id}
                    wished={player.goal === item.id}
                    count={item.stackable ? counts.get(item.id) : undefined}
                    onTap={() => choose(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {buying && <BuyDialog player={player} itemId={buying} onClose={() => setBuying(null)} onBought={bought} />}
    </div>
  );
}

/** Her, a pet or a thing, standing on (0, 0). */
function Figure({ placed, player }: { placed: Placed; player: Player }): ReactNode {
  if (placed.kind === 'me') {
    // The avatar's feet are at y = 266 of its 320-high viewBox, which starts at -40.
    const h = 240;
    return (
      <g className="garden-breathe">
        <svg x={-h * 0.3125} y={-h * (306 / 320)} width={h * 0.625} height={h} overflow="visible">
          <Avatar look={player.look} />
        </svg>
      </g>
    );
  }
  if (placed.kind === 'pet') {
    const s = 95;
    return (
      <g className="garden-sway">
        <svg x={-s / 2} y={-s * (112 / 120)} width={s} height={s} overflow="visible">
          <Pet id={placed.itemId} />
        </svg>
      </g>
    );
  }
  const thing = GARDEN[placed.itemId];
  if (!thing) return null;
  return <g transform={`translate(${-thing.w / 2} ${-thing.h})`}>{thing.draw(thingPaint(placed.spot.color))}</g>;
}

function Landscape({ hasLand }: { hasLand: boolean }) {
  return (
    <g className="landscape">
      <path d="M -600 210 C -200 90 150 170 380 135 C 600 100 800 170 1020 125 C 1250 80 1400 150 1600 180 L 1600 900 L -600 900 Z" fill="#c4f0bb" />
      <path d="M -600 250 C -100 210 250 210 500 210 C 750 210 1100 210 1600 250 L 1600 2000 L -600 2000 Z" fill="#9fe39a" />
      {hasLand ? (
        <>
          <path d="M 55 240 L 945 240 L 1000 640 L 0 640 Z" fill="#aeeaa6" />
          <path d="M 476 262 C 450 360 545 420 500 510 C 470 570 520 610 510 650 L 590 650 C 590 600 550 570 580 510 C 625 420 530 360 524 262 Z" fill="#f4e3c1" stroke="#e2c995" strokeWidth={3} />
          <Fence />
        </>
      ) : (
        [
          [140, 330, '#ff8fd8'],
          [210, 470, '#fff'],
          [760, 380, '#ffd93d'],
          [860, 540, '#ff8fd8'],
          [640, 600, '#fff'],
          [90, 590, '#ffd93d'],
          [420, 290, '#fff'],
        ].map(([x, y, c], i) => (
          <g key={i}>
            <path d={`M ${x} ${+y + 12} L ${x} ${y}`} stroke="#4fb35a" strokeWidth={3} />
            <circle cx={x} cy={y} r={7} fill={c as string} stroke="#00000022" strokeWidth={1.5} />
            <circle cx={x} cy={y} r={2.5} fill="#ffd93d" />
          </g>
        ))
      )}
    </g>
  );
}

function Fence() {
  const picket = (x: number, y: number, s: number, key: string) => (
    <path key={key} d={`M ${x - 7 * s} ${y} L ${x - 7 * s} ${y - 34 * s} L ${x} ${y - 42 * s} L ${x + 7 * s} ${y - 34 * s} L ${x + 7 * s} ${y} Z`} fill="#fff" stroke="#c9bfd9" strokeWidth={2.5 * s} strokeLinejoin="round" />
  );
  const back = Array.from({ length: 23 }, (_, i) => 55 + i * 40.5);
  const side = Array.from({ length: 7 }, (_, i) => i / 6);
  return (
    <g className="fence">
      <path d="M 50 226 L 950 226" stroke="#d9cfe8" strokeWidth={4} />
      {back.map((x) => picket(x, 240, 0.7, `b${x}`))}
      {side.map((t) => picket(55 - 55 * t, 240 + 400 * t, 0.7 + 0.6 * t, `l${t}`))}
      {side.map((t) => picket(945 + 55 * t, 240 + 400 * t, 0.7 + 0.6 * t, `r${t}`))}
    </g>
  );
}

function ForSaleSign() {
  return (
    <g transform="translate(610 440) scale(1.2)">
      <ellipse cx={0} cy={6} rx={40} ry={7} fill="rgba(60,90,40,0.2)" />
      <rect x={-6} y={-90} width={12} height={96} rx={3} fill="#c98f5a" stroke="#8f5d33" strokeWidth={3} />
      <g className="sign-swing">
        <rect x={-80} y={-150} width={160} height={74} rx={12} fill="#fff" stroke="#ff5e7e" strokeWidth={5} />
        <text x={0} y={-114} textAnchor="middle" fontSize={30} fontWeight={700} fill="#ff5e7e" fontFamily="Fredoka, sans-serif">
          TE KOOP
        </text>
        <path d={heartPath(0, -92, 8)} fill="#ff8fd8" />
      </g>
    </g>
  );
}

/** Before she owns land: what it costs and how far she is. */
function LandOffer({ player, onBuy }: { player: Player; onBuy: () => void }) {
  const land = itemById('land')!;
  const short = land.price - player.profile.balance;
  return (
    <div className="land-offer card">
      <p className="land-offer-title">Een eigen stukje land!</p>
      <p className="land-offer-text">
        Daarna kun je er een huisje op zetten en een tuin maken. Het kost <Price n={land.price} />.
      </p>
      <button className="big-btn" onClick={onBuy}>
        {short > 0 ? `Nog ${coins(short)} sparen` : 'Kopen! 🏡'}
      </button>
    </div>
  );
}
