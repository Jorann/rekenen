import { describe, expect, it } from 'vitest';
import { CATALOG } from '../../../shared/catalog.ts';
import { GARDEN, HOUSES } from '../home/drawings.tsx';
import { sanitizeHome } from '../home/home.ts';
import { WEARABLES } from './clothes.tsx';
import { colorOf, DEFAULT_LOOK, HAIR_COLORS, recolor, sanitizeLook, takeOff, wear } from './look.ts';
import { hasPetDrawing } from './pets.tsx';

describe('drawings', () => {
  it('exist for everything in the shop', () => {
    for (const item of CATALOG) {
      const drawn =
        item.slot === 'hairColor'
          ? item.id in HAIR_COLORS
          : item.slot === 'pet'
            ? hasPetDrawing(item.id)
            : item.slot === 'land'
              ? true
              : item.slot === 'house'
                ? item.id in HOUSES
                : item.slot === 'garden'
                  ? item.id in GARDEN
                  : item.id in WEARABLES;
      expect(drawn, item.id).toBe(true);
    }
  });
});

describe('wear', () => {
  it('swaps an item in the same slot', () => {
    const look = wear(wear(DEFAULT_LOOK, 'bow'), 'crown');
    expect(look.worn.hat).toBe('crown');
  });

  it('takes off top and bottom for a dress, and puts them back after', () => {
    const inDress = wear(DEFAULT_LOOK, 'summer-dress');
    expect(inDress.worn).toMatchObject({ dress: 'summer-dress', shoes: 'sneakers' });
    expect(inDress.worn.top).toBeUndefined();
    expect(inDress.worn.bottom).toBeUndefined();

    const back = wear(inDress, 'striped');
    expect(back.worn.dress).toBeUndefined();
    expect(back.worn).toMatchObject({ top: 'striped', bottom: 'trousers' });
  });

  it('changes the hair colour', () => {
    expect(wear(DEFAULT_LOOK, 'hair-pink').hairColor).toBe('hair-pink');
  });
});

describe('takeOff', () => {
  it('removes accessories but never the clothes she needs', () => {
    expect(takeOff(wear(DEFAULT_LOOK, 'crown'), 'hat').worn.hat).toBeUndefined();
    expect(takeOff(DEFAULT_LOOK, 'top')).toBe(DEFAULT_LOOK);
    expect(takeOff(DEFAULT_LOOK, 'shoes')).toBe(DEFAULT_LOOK);
  });
});

describe('colours', () => {
  it('remembers a colour per item', () => {
    const look = recolor(DEFAULT_LOOK, 'boots', '#ff5e7e');
    expect(colorOf(look, 'boots')).toBe('#ff5e7e');
    expect(colorOf(look, 'tshirt')).toBe(DEFAULT_LOOK.colors.tshirt);
  });
});

describe('sanitizeLook', () => {
  it('falls back to the default look for nonsense', () => {
    expect(sanitizeLook(null, new Set())).toEqual(DEFAULT_LOOK);
    expect(sanitizeLook('hello', new Set())).toEqual(DEFAULT_LOOK);
  });

  it('drops items she does not own, or in the wrong slot', () => {
    const saved = { ...DEFAULT_LOOK, worn: { ...DEFAULT_LOOK.worn, hat: 'crown', face: 'bow', top: 'hoodie' }, hairColor: 'hair-rainbow' };
    const look = sanitizeLook(saved, new Set(['bow']));
    expect(look.worn.hat).toBeUndefined();
    expect(look.worn.face).toBeUndefined();
    expect(look.worn.top).toBe('tshirt');
    expect(look.hairColor).toBe(DEFAULT_LOOK.hairColor);
  });

  it('keeps what she owns', () => {
    const saved = wear(wear(DEFAULT_LOOK, 'crown'), 'hair-rainbow');
    const look = sanitizeLook(saved, new Set(['crown', 'hair-rainbow']));
    expect(look.worn.hat).toBe('crown');
    expect(look.hairColor).toBe('hair-rainbow');
  });

  it('only keeps real colours for colourable items', () => {
    const look = sanitizeLook({ ...DEFAULT_LOOK, colors: { boots: '#123456', crown: '#ffffff', tshirt: 'red' } }, new Set());
    expect(look.colors.boots).toBe('#123456');
    expect(look.colors.crown).toBeUndefined();
    expect(look.colors.tshirt).toBe(DEFAULT_LOOK.colors.tshirt);
  });
});

describe('sanitizeHome', () => {
  it('only puts a house on the land that she owns', () => {
    expect(sanitizeHome({ house: 'castle', spots: {} }, new Set(['land'])).house).toBeNull();
    expect(sanitizeHome({ house: 'castle', spots: {} }, new Set(['land', 'castle'])).house).toBe('castle');
    expect(sanitizeHome({ house: 'tulip', spots: {} }, new Set(['tulip'])).house).toBeNull();
  });

  it('keeps valid spots and drops broken ones', () => {
    const home = sanitizeHome({ house: null, spots: { a: { x: 10, y: 20, color: '#ff5e7e' }, b: { x: 'left' }, c: null } }, new Set());
    expect(home.spots).toEqual({ a: { x: 10, y: 20, color: '#ff5e7e' } });
  });
});
