import { describe, expect, it } from 'vitest';
import { CATALOG, decidePurchase, itemById } from '../../../shared/catalog.ts';
import { applyJob, balanceOf, EMPTY_PROFILE, type ServerProfile } from './ledger.ts';
import type { Job } from './outbox.ts';

const coin: Job = { url: '/q', body: {}, meta: { kind: 'coin', player: 'Nomi' } };

function purchase(itemId: string, id = `p-${itemId}`): Job {
  return { url: '/p', body: { id, itemId, purchasedAt: '2026-10-16T10:00:00.000Z' }, meta: { kind: 'purchase', player: 'Nomi' } };
}

function withCoins(n: number): ServerProfile {
  return { ...EMPTY_PROFILE, earned: n };
}

describe('catalog', () => {
  it('has unique ids', () => {
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(CATALOG.length);
  });

  it('has whole, non-negative prices', () => {
    for (const item of CATALOG) expect(Number.isInteger(item.price) && item.price >= 0, item.id).toBe(true);
  });

  it('only requires items that exist and cost something', () => {
    for (const item of CATALOG.filter((i) => i.requires)) {
      expect(itemById(item.requires!)?.price, item.id).toBeGreaterThan(0);
    }
  });

  it('gives her a full outfit for free', () => {
    for (const slot of ['top', 'bottom', 'shoes', 'hairColor'] as const) {
      expect(CATALOG.some((i) => i.slot === slot && i.price === 0), slot).toBe(true);
    }
  });
});

describe('decidePurchase', () => {
  it('sells an item she can afford', () => {
    expect(decidePurchase('bow', new Set(), 10)).toBe('ok');
  });

  it('refuses when she has too few coins', () => {
    expect(decidePurchase('crown', new Set(), 199)).toBe('too-expensive');
  });

  it('sells an item only once, unless it is for the garden', () => {
    expect(decidePurchase('bow', new Set(['bow']), 100)).toBe('owned');
    expect(decidePurchase('tshirt', new Set(), 100)).toBe('owned');
    expect(decidePurchase('tulip', new Set(['land', 'tulip']), 100)).toBe('ok');
  });

  it('needs the land before a house or the garden', () => {
    expect(decidePurchase('tent', new Set(), 1000)).toBe('locked');
    expect(decidePurchase('tent', new Set(['land']), 1000)).toBe('ok');
  });

  it('rejects unknown items', () => {
    expect(decidePurchase('spaceship', new Set(), 1000)).toBe('unknown');
  });
});

describe('applyJob', () => {
  it('adds a coin for every solved sum', () => {
    const p = [coin, coin, coin].reduce((acc, j) => applyJob(acc, j), EMPTY_PROFILE);
    expect(balanceOf(p)).toBe(3);
  });

  it('spends coins on a purchase', () => {
    const p = applyJob(withCoins(12), purchase('bow'));
    expect(p.purchases.map((x) => x.itemId)).toEqual(['bow']);
    expect(balanceOf(p)).toBe(2);
  });

  it('ignores a purchase she cannot afford, like the server will', () => {
    const p = applyJob(withCoins(5), purchase('bow'));
    expect(p.purchases).toEqual([]);
    expect(balanceOf(p)).toBe(5);
  });

  it('trusts a purchase the server already accepted', () => {
    const p = applyJob(withCoins(5), purchase('bow'), true);
    expect(p.purchases.map((x) => x.itemId)).toEqual(['bow']);
  });

  it('counts the same purchase only once', () => {
    const job = purchase('tulip');
    const p = applyJob(applyJob({ ...withCoins(500), purchases: [{ id: 'l', itemId: 'land', price: 0, purchasedAt: '' }] }, job), job);
    expect(p.purchases.filter((x) => x.itemId === 'tulip')).toHaveLength(1);
  });

  it('keeps the newest state change', () => {
    const state = (value: string, updatedAt: string): Job => ({
      url: '/s',
      body: { key: 'goal', value, updatedAt },
      meta: { kind: 'state', player: 'Nomi', key: 'goal' },
    });
    let p = applyJob(EMPTY_PROFILE, state('crown', '2026-10-16T10:00:00.000Z'));
    p = applyJob(p, state('bow', '2026-10-16T09:00:00.000Z'));
    expect(p.state.goal?.value).toBe('crown');
    p = applyJob(p, state('tiara', '2026-10-16T11:00:00.000Z'));
    expect(p.state.goal?.value).toBe('tiara');
  });
});
