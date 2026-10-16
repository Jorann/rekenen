import { itemById } from '../../../shared/catalog.ts';

/** Where something stands in her garden, in garden units (see Place.tsx). */
export interface Spot {
  x: number;
  y: number;
  color?: string;
}

/** Her garden: which house stands on the land, and where everything else is. Saved as the 'home' state. */
export interface HomeState {
  house: string | null;
  /** By purchase id for bought things, 'me' for her and 'pet:<id>' for her pets. */
  spots: Record<string, Spot>;
}

const HEX = /^#[0-9a-f]{6}$/i;

export function sanitizeHome(value: unknown, owned: ReadonlySet<string>): HomeState {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<HomeState>;
  const house = typeof v.house === 'string' && itemById(v.house)?.slot === 'house' && owned.has(v.house) ? v.house : null;
  const spots: Record<string, Spot> = {};
  for (const [key, s] of Object.entries(v.spots ?? {})) {
    if (!s || typeof s !== 'object' || !Number.isFinite(s.x) || !Number.isFinite(s.y)) continue;
    spots[key] = { x: s.x, y: s.y, ...(typeof s.color === 'string' && HEX.test(s.color) ? { color: s.color } : {}) };
  }
  return { house, spots };
}
