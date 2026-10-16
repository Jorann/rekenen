import { itemById, owns } from '../../../shared/catalog.ts';

/** How her character looks. Saved on the server as the 'avatar' state. */
export interface Look {
  skin: string;
  eyes: string;
  hair: HairStyle;
  /** A hairColor item from the catalog. */
  hairColor: string;
  freckles: boolean;
  /** What she wears in each slot. */
  worn: Worn;
  /** The colour she chose for each colourable item, kept when she takes it off. */
  colors: Record<string, string>;
}

export const WORN_SLOTS = ['hat', 'face', 'top', 'bottom', 'dress', 'shoes', 'neck', 'back', 'hand', 'pet'] as const;
export type WornSlot = (typeof WORN_SLOTS)[number];

export type Worn = Partial<Record<WornSlot, string>>;

export const HAIR_STYLES = ['long', 'ponytail', 'pigtails', 'braids', 'bob', 'bun', 'curly', 'short'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HAIR_STYLE_NAMES: Record<HairStyle, string> = {
  long: 'Lang',
  ponytail: 'Paardenstaart',
  pigtails: 'Staartjes',
  braids: 'Vlechtjes',
  bob: 'Boblijn',
  bun: 'Knotje',
  curly: 'Krullen',
  short: 'Kort',
};

export const SKIN_TONES = ['#ffe3cf', '#f8cfae', '#eab38c', '#cf9468', '#a86f48', '#7a4b30'];

export const EYE_COLORS = ['#6b4226', '#3f7fd8', '#3d9a5b', '#7b8494', '#2f2440'];

/** Colours she can pick for clothes, once she has them. */
export const CLOTH_COLORS = [
  '#ff5e7e', // red-pink
  '#ff9f43', // orange
  '#ffd93d', // yellow
  '#6bcb77', // green
  '#5fd3c6', // mint
  '#74b9ff', // light blue
  '#4d6bff', // blue
  '#9b5de5', // purple
  '#ff8fd8', // pink
  '#ffc6e5', // light pink
  '#ffffff', // white
  '#3b3355', // dark
];

export interface HairPaint {
  base: string;
  dark: string;
  light: string;
}

/** 'rainbow' is drawn with a gradient. */
export const HAIR_COLORS: Record<string, HairPaint | 'rainbow'> = {
  'hair-black': { base: '#3a3040', dark: '#1f1925', light: '#5c5068' },
  'hair-darkbrown': { base: '#5b3a29', dark: '#3a2418', light: '#7d5540' },
  'hair-brown': { base: '#9a6234', dark: '#6b3f1d', light: '#bf8550' },
  'hair-blond': { base: '#f2cc6b', dark: '#c99a35', light: '#fbe3a0' },
  'hair-red': { base: '#d9652b', dark: '#a8431a', light: '#ef8c52' },
  'hair-pink': { base: '#ff8cc6', dark: '#e0559c', light: '#ffc0e0' },
  'hair-purple': { base: '#a77bf0', dark: '#7a4fcc', light: '#c9a8ff' },
  'hair-blue': { base: '#5aa6ff', dark: '#2f74d6', light: '#9ccaff' },
  'hair-mint': { base: '#62d9bf', dark: '#2fae93', light: '#a5f0df' },
  'hair-rainbow': 'rainbow',
};

export const DEFAULT_LOOK: Look = {
  skin: SKIN_TONES[1],
  eyes: EYE_COLORS[0],
  hair: 'long',
  hairColor: 'hair-brown',
  freckles: false,
  worn: { top: 'tshirt', bottom: 'trousers', shoes: 'sneakers' },
  colors: { tshirt: '#ff8fd8', trousers: '#74b9ff', sneakers: '#ffffff' },
};

/** Mixes a colour with white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const a = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * a);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Fill, outline and highlight for a piece of clothing in the chosen colour. */
export interface Paint {
  base: string;
  dark: string;
  light: string;
}

export function paint(color: string): Paint {
  // White clothes need a visible outline, dark ones a lighter highlight.
  const isLight = parseInt(color.slice(1), 16) > 0xeeeeee;
  return { base: color, dark: shade(color, isLight ? -0.22 : -0.28), light: shade(color, 0.45) };
}

const WORN_SLOT_SET = new Set<string>(WORN_SLOTS);
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * A look read from the server or storage, made safe to draw: anything unknown or no longer hers
 * falls back to the default, and she always wears something.
 */
export function sanitizeLook(value: unknown, owned: ReadonlySet<string>): Look {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<Look>;
  const has = (id: unknown) => {
    const item = typeof id === 'string' ? itemById(id) : undefined;
    return !!item && owns(item, owned);
  };

  const worn: Worn = {};
  for (const [slot, id] of Object.entries(v.worn ?? {})) {
    if (WORN_SLOT_SET.has(slot) && has(id) && itemById(id as string)!.slot === slot) worn[slot as WornSlot] = id as string;
  }
  const colors: Record<string, string> = { ...DEFAULT_LOOK.colors };
  for (const [id, color] of Object.entries(v.colors ?? {})) {
    if (itemById(id)?.colorable && typeof color === 'string' && HEX.test(color)) colors[id] = color;
  }
  return dressed({
    skin: typeof v.skin === 'string' && SKIN_TONES.includes(v.skin) ? v.skin : DEFAULT_LOOK.skin,
    eyes: typeof v.eyes === 'string' && EYE_COLORS.includes(v.eyes) ? v.eyes : DEFAULT_LOOK.eyes,
    hair: HAIR_STYLES.includes(v.hair as HairStyle) ? (v.hair as HairStyle) : DEFAULT_LOOK.hair,
    hairColor: typeof v.hairColor === 'string' && v.hairColor in HAIR_COLORS && has(v.hairColor) ? v.hairColor : DEFAULT_LOOK.hairColor,
    freckles: v.freckles === true,
    worn,
    colors,
  });
}

/** A dress replaces top and bottom; without a dress she wears a top, a bottom and always shoes. */
export function dressed(look: Look): Look {
  const worn = { ...look.worn };
  if (worn.dress) {
    delete worn.top;
    delete worn.bottom;
  } else {
    worn.top ??= DEFAULT_LOOK.worn.top;
    worn.bottom ??= DEFAULT_LOOK.worn.bottom;
  }
  worn.shoes ??= DEFAULT_LOOK.worn.shoes;
  return { ...look, worn };
}

/** The slot an item is worn in, or null for things that aren't worn (the house, the garden). */
export function wornSlot(itemId: string): WornSlot | null {
  const slot = itemById(itemId)?.slot;
  return slot && WORN_SLOT_SET.has(slot) ? (slot as WornSlot) : null;
}

/** The look with an item put on, instead of whatever was in its slot. */
export function wear(look: Look, itemId: string): Look {
  if (itemById(itemId)?.slot === 'hairColor') return { ...look, hairColor: itemId };
  const slot = wornSlot(itemId);
  if (!slot) return look;
  const worn: Worn = { ...look.worn, [slot]: itemId };
  if (slot === 'dress') {
    delete worn.top;
    delete worn.bottom;
  }
  if (slot === 'top' || slot === 'bottom') delete worn.dress;
  return dressed({ ...look, worn });
}

/** Takes off an item that can be left off (hats, glasses, pets...). Clothes and shoes stay on. */
export function takeOff(look: Look, slot: WornSlot): Look {
  if (slot === 'top' || slot === 'bottom' || slot === 'shoes') return look;
  const worn = { ...look.worn };
  delete worn[slot];
  return dressed({ ...look, worn });
}

export function colorOf(look: Look, itemId: string): string {
  return look.colors[itemId] ?? defaultColor(itemId);
}

export function recolor(look: Look, itemId: string, color: string): Look {
  return { ...look, colors: { ...look.colors, [itemId]: color } };
}

const DEFAULT_COLORS: Record<string, string> = {
  bow: '#ff5e7e',
  cap: '#4d6bff',
  beanie: '#9b5de5',
  'cat-ears': '#3b3355',
  headphones: '#ff8fd8',
  'witch-hat': '#9b5de5',
  glasses: '#9b5de5',
  sunglasses: '#ff5e7e',
  'heart-glasses': '#ff5e7e',
  striped: '#74b9ff',
  'heart-shirt': '#ffffff',
  hoodie: '#9b5de5',
  'glitter-top': '#ff8fd8',
  shorts: '#ff9f43',
  skirt: '#9b5de5',
  tutu: '#ffc6e5',
  'summer-dress': '#ffd93d',
  'party-dress': '#ff5e7e',
  'princess-dress': '#ff8fd8',
  'ballet-flats': '#ff8fd8',
  boots: '#9b5de5',
  'roller-skates': '#5fd3c6',
  scarf: '#ff5e7e',
  backpack: '#ff9f43',
  cape: '#9b5de5',
  balloon: '#ff5e7e',
};

export function defaultColor(itemId: string): string {
  return DEFAULT_COLORS[itemId] ?? CLOTH_COLORS[8];
}
