import { Router } from 'express';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { decidePurchase, itemById, STATE_KEYS } from '../../shared/catalog.ts';
import { pool } from './db.ts';

/** Coins, the shop, her character and her garden. Everything is per player name. */
export const players = Router();

const playerName = z.string().trim().min(1).max(50);

const purchase = z.object({
  id: z.uuid(),
  itemId: z.string().min(1).max(64),
  purchasedAt: z.iso.datetime(),
});

const stateChange = z.object({
  key: z.enum(STATE_KEYS),
  value: z.json(),
  updatedAt: z.iso.datetime(),
});

const EARNED = `SELECT count(*)::int AS n FROM questions q JOIN sessions s ON s.id = q.session_id WHERE s.player_id = $1`;
const GIFTED = `SELECT coalesce(sum(amount), 0)::int AS n FROM coin_gifts WHERE player_id = $1`;
const SPENT = `SELECT coalesce(sum(price), 0)::int AS n FROM purchases WHERE player_id = $1`;

async function playerId(db: PoolClient, name: string): Promise<number> {
  // ON CONFLICT DO UPDATE locks the player's row until the transaction ends, so two purchases
  // for the same player are checked one after the other and can't both spend the same coins.
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO players (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [name],
  );
  return rows[0].id;
}

async function count(db: PoolClient, sql: string, id: number): Promise<number> {
  const { rows } = await db.query<{ n: number }>(sql, [id]);
  return rows[0].n;
}

async function inTransaction<T>(work: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  let broken: Error | undefined;
  try {
    await db.query('BEGIN');
    const result = await work(db);
    await db.query('COMMIT');
    return result;
  } catch (err) {
    // If even the rollback fails the connection is broken: report the first error, and don't reuse it.
    await db.query('ROLLBACK').catch((rollbackErr: Error) => {
      broken = rollbackErr;
    });
    throw err;
  } finally {
    db.release(broken);
  }
}

players.get('/:name/profile', async (req, res) => {
  const name = playerName.parse(req.params.name);
  const db = await pool.connect();
  try {
    const player = await db.query<{ id: number }>('SELECT id FROM players WHERE name = $1', [name]);
    if (player.rowCount === 0) {
      res.json({ earned: 0, gifted: 0, spent: 0, balance: 0, gifts: [], purchases: [], state: {} });
      return;
    }
    const id = player.rows[0].id;
    const earned = await count(db, EARNED, id);
    const gifts = await db.query<{ id: number; amount: number; note: string | null; createdAt: Date }>(
      `SELECT id, amount, note, created_at AS "createdAt" FROM coin_gifts WHERE player_id = $1 ORDER BY created_at, id`,
      [id],
    );
    const purchases = await db.query<{ id: string; itemId: string; price: number; purchasedAt: Date }>(
      `SELECT id, item_id AS "itemId", price, purchased_at AS "purchasedAt"
         FROM purchases WHERE player_id = $1 ORDER BY purchased_at, created_at`,
      [id],
    );
    const state = await db.query<{ key: string; value: unknown; updatedAt: Date }>(
      `SELECT key, value, updated_at AS "updatedAt" FROM player_state WHERE player_id = $1`,
      [id],
    );
    const gifted = gifts.rows.reduce((sum, g) => sum + g.amount, 0);
    const spent = purchases.rows.reduce((sum, p) => sum + p.price, 0);
    res.json({
      earned,
      gifted,
      spent,
      balance: earned + gifted - spent,
      gifts: gifts.rows,
      purchases: purchases.rows,
      state: Object.fromEntries(state.rows.map((r) => [r.key, { value: r.value, updatedAt: r.updatedAt }])),
    });
  } finally {
    db.release();
  }
});

// Idempotent like every other write: the iPad resends a purchase until the server has answered.
players.post('/:name/purchases', async (req, res) => {
  const name = playerName.parse(req.params.name);
  const p = purchase.parse(req.body);

  const result = await inTransaction(async (db) => {
    const id = await playerId(db, name);
    const existing = await db.query('SELECT 1 FROM purchases WHERE id = $1', [p.id]);
    if (existing.rowCount) return { status: 200, body: { id: p.id } };

    const owned = await db.query<{ item_id: string }>('SELECT DISTINCT item_id FROM purchases WHERE player_id = $1', [id]);
    const balance = (await count(db, EARNED, id)) + (await count(db, GIFTED, id)) - (await count(db, SPENT, id));
    const decision = decidePurchase(p.itemId, new Set(owned.rows.map((r) => r.item_id)), balance);

    switch (decision) {
      case 'unknown':
        return { status: 400, body: { error: `unknown item ${p.itemId}` } };
      case 'locked':
      case 'too-expensive':
        return { status: 409, body: { error: decision, balance } };
      case 'owned':
        return { status: 200, body: { id: p.id, alreadyOwned: true } };
      case 'ok': {
        const price = itemById(p.itemId)!.price;
        await db.query(
          'INSERT INTO purchases (id, player_id, item_id, price, purchased_at) VALUES ($1, $2, $3, $4, $5)',
          [p.id, id, p.itemId, price, p.purchasedAt],
        );
        return { status: 201, body: { id: p.id, price, balance: balance - price } };
      }
    }
  });
  res.status(result.status).json(result.body);
});

players.post('/:name/state', async (req, res) => {
  const name = playerName.parse(req.params.name);
  const s = stateChange.parse(req.body);
  await inTransaction(async (db) => {
    const id = await playerId(db, name);
    await db.query(
      `INSERT INTO player_state (player_id, key, value, updated_at) VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (player_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
       WHERE player_state.updated_at < EXCLUDED.updated_at`,
      [id, s.key, JSON.stringify(s.value), s.updatedAt],
    );
  });
  res.json({ key: s.key });
});
