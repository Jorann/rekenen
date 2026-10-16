import { decidePurchase, itemById, type StateKey } from '../../../shared/catalog.ts';
import type { Job } from './outbox.ts';

// The coin bookkeeping, without storage or network, so it can be tested on its own.

export interface Purchase {
  id: string;
  itemId: string;
  price: number;
  purchasedAt: string;
}

export interface Gift {
  id: number;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface Stamped {
  value: unknown;
  updatedAt: string;
}

/** As the server sends it (GET /api/players/:name/profile). */
export interface ServerProfile {
  earned: number;
  gifted: number;
  spent: number;
  gifts: Gift[];
  purchases: Purchase[];
  state: Partial<Record<StateKey, Stamped>>;
}

export interface Profile extends ServerProfile {
  balance: number;
  /** Ids of everything she bought (free items aren't listed; see owns() in the catalog). */
  owned: ReadonlySet<string>;
  /** False until the server has answered once. */
  synced: boolean;
}

export const EMPTY_PROFILE: ServerProfile = { earned: 0, gifted: 0, spent: 0, gifts: [], purchases: [], state: {} };

export function balanceOf(p: ServerProfile): number {
  return p.earned + p.gifted - p.spent;
}

/**
 * The profile with one outbox job applied, the way the server will apply it.
 * confirmed: the server has just stored this purchase (it checked the balance and the rules itself).
 */
export function applyJob(p: ServerProfile, job: Job, confirmed = false): ServerProfile {
  switch (job.meta?.kind) {
    case 'coin':
      return { ...p, earned: p.earned + 1 };
    case 'purchase': {
      const body = job.body as { id: string; itemId: string; purchasedAt: string };
      const item = itemById(body.itemId);
      if (!item || p.purchases.some((x) => x.id === body.id)) return p;
      if (!confirmed && decidePurchase(body.itemId, new Set(p.purchases.map((x) => x.itemId)), balanceOf(p)) !== 'ok') return p;
      const purchase = { id: body.id, itemId: body.itemId, price: item.price, purchasedAt: body.purchasedAt };
      return { ...p, spent: p.spent + item.price, purchases: [...p.purchases, purchase] };
    }
    case 'state': {
      const body = job.body as { key: StateKey; value: unknown; updatedAt: string };
      const current = p.state[body.key];
      if (current && current.updatedAt >= body.updatedAt) return p;
      return { ...p, state: { ...p.state, [body.key]: { value: body.value, updatedAt: body.updatedAt } } };
    }
    default:
      return p;
  }
}
