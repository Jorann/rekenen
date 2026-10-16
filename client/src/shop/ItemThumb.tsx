import { itemById, type Slot } from '../../../shared/catalog.ts';
import { WEARABLES } from '../avatar/clothes.tsx';
import { colorOf, HAIR_COLORS, paint, shade, type Look } from '../avatar/look.ts';
import { Pet } from '../avatar/pets.tsx';
import { GARDEN, HOUSES, LAND, thingPaint } from '../home/drawings.tsx';

/** Which part of the avatar's drawing shows an item of each slot best. */
const SLOT_VIEWBOX: Partial<Record<Slot, string>> = {
  hat: '30 -30 140 110',
  face: '42 66 116 66',
  top: '45 136 110 90',
  bottom: '50 196 100 74',
  dress: '35 138 130 136',
  shoes: '58 222 84 52',
  neck: '70 136 60 50',
  back: '0 80 200 190',
  hand: '110 130 80 100',
};

/** The picture of an item on its shop card. */
export function ItemThumb({ id, look, color }: { id: string; look: Look; color?: string }) {
  const item = itemById(id);
  if (!item) return null;

  if (item.slot === 'hairColor') {
    const c = HAIR_COLORS[id];
    return (
      <svg className="thumb" viewBox="0 0 60 60" aria-hidden="true">
        <path
          d="M 12 40 C 6 18 20 6 30 6 C 40 6 54 18 48 40 C 46 50 40 54 36 52 C 38 40 36 26 30 22 C 24 26 22 40 24 52 C 20 54 14 50 12 40 Z"
          fill={c === 'rainbow' ? 'url(#rainbow-v)' : c.base}
          stroke={c === 'rainbow' ? '#8a52d6' : c.dark}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <path d="M 20 16 Q 26 11 33 11" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      </svg>
    );
  }
  if (item.slot === 'pet') return <Pet id={id} className="thumb" />;

  const thing = item.slot === 'land' ? LAND : item.slot === 'house' ? HOUSES[id] : item.slot === 'garden' ? GARDEN[id] : undefined;
  if (thing) {
    return (
      <svg className="thumb" viewBox={`0 0 ${thing.w} ${thing.h}`} aria-hidden="true">
        {thing.draw(thingPaint(color))}
      </svg>
    );
  }

  const w = WEARABLES[id];
  if (!w) return null;
  const p = paint(color ?? colorOf(look, id));
  const skin = paint(look.skin);
  skin.dark = shade(look.skin, -0.2);
  return (
    <svg className="thumb" viewBox={w.thumb ?? SLOT_VIEWBOX[item.slot]} aria-hidden="true">
      {w.back?.(p, skin)}
      {w.main?.(p, skin)}
      {w.over?.(p, skin)}
    </svg>
  );
}
