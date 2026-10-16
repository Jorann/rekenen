import { Router, type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { itemById } from '../../shared/catalog.ts';
import { pool } from './db.ts';
import {
  activity,
  addSub,
  balanceSeries,
  bucketSize,
  kpis,
  mistakes,
  slowest,
  timesTables,
  type CoinDay,
  type CoinsView,
  type Overview,
  type PlayerSummary,
  type SessionDetail,
  type SessionSummary,
  type SumRow,
  type WrongRow,
} from './stats.ts';

export const api = Router();

class NotFound extends Error {}

function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Every view is for one player, over the last `days` days (0 = everything), with days in the viewer's time zone. */
const scope = z.object({
  player: z.string().trim().min(1).max(50),
  days: z.coerce.number().int().min(0).max(3660).default(30),
  tz: z.string().max(64).refine(isTimeZone).catch('Europe/Amsterdam'),
});

function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

async function playerId(name: string): Promise<number> {
  const { rows } = await pool.query<{ id: number }>('SELECT id FROM players WHERE name = $1', [name]);
  if (!rows.length) throw new NotFound(`no player ${name}`);
  return rows[0].id;
}

async function today(tz: string): Promise<string> {
  const { rows } = await pool.query<{ today: string }>(`SELECT to_char(now() AT TIME ZONE $1, 'YYYY-MM-DD') AS today`, [tz]);
  return rows[0].today;
}

/** The local day a timestamp column falls on. */
const localDay = (column: string, tzParam: string) => `to_char(${column} AT TIME ZONE ${tzParam}, 'YYYY-MM-DD')`;

api.get('/players', async (_req, res) => {
  const { rows } = await pool.query<PlayerSummary>(
    `SELECT p.name, count(q.id)::int AS solved, max(q.solved_at) AS "lastPlayed"
       FROM players p
       LEFT JOIN sessions s ON s.player_id = p.id
       LEFT JOIN questions q ON q.session_id = s.id
      GROUP BY p.id
      ORDER BY max(q.solved_at) DESC NULLS LAST, p.name`,
  );
  res.json(rows);
});

api.get('/overview', async (req, res) => {
  const { player, days, tz } = scope.parse(req.query);
  const id = await playerId(player);
  const last = await today(tz);

  let first: string | null = days > 0 ? addDays(last, -(days - 1)) : null;
  if (!first) {
    const { rows } = await pool.query<{ first: string | null }>(
      `SELECT ${localDay('min(q.solved_at)', '$2')} AS first
         FROM questions q JOIN sessions s ON s.id = q.session_id WHERE s.player_id = $1`,
      [id, tz],
    );
    first = rows[0].first;
  }
  // With a fixed period, also fetch the period before it, to compare.
  const from = days > 0 ? addDays(first!, -days) : first;

  const sums = from
    ? (
        await pool.query<SumRow>(
          `SELECT q.session_id AS "sessionId", q.operation AS op, q.operand_a AS a, q.operand_b AS b,
                  q.correct_answer AS answer, q.duration_ms AS "durationMs", q.wrong_attempts AS wrong,
                  ${localDay('q.solved_at', '$2')} AS day,
                  to_char(date_trunc('week', q.solved_at AT TIME ZONE $2), 'YYYY-MM-DD') AS week
             FROM questions q JOIN sessions s ON s.id = q.session_id
            WHERE s.player_id = $1 AND (q.solved_at AT TIME ZONE $2)::date BETWEEN $3::date AND $4::date`,
          [id, tz, from, last],
        )
      ).rows
    : [];
  const current = first ? sums.filter((r) => r.day >= first) : [];
  const before = days > 0 ? sums.filter((r) => r.day < first!) : null;

  const wrong = first
    ? (
        await pool.query<WrongRow>(
          `SELECT q.operation AS op, q.operand_a AS a, q.operand_b AS b, a.answer AS "wrongAnswer"
             FROM attempts a
             JOIN questions q ON q.id = a.question_id
             JOIN sessions s ON s.id = q.session_id
            WHERE s.player_id = $1 AND NOT a.is_correct AND (q.solved_at AT TIME ZONE $2)::date BETWEEN $3::date AND $4::date`,
          [id, tz, first, last],
        )
      ).rows
    : [];

  const lastPlayed = await pool.query<{ at: string | null }>(
    `SELECT max(q.solved_at) AS at FROM questions q JOIN sessions s ON s.id = q.session_id WHERE s.player_id = $1`,
    [id],
  );

  const bucket = first ? bucketSize(first, last) : 'day';
  const overview: Overview = {
    player,
    first,
    last,
    bucket,
    lastPlayed: lastPlayed.rows[0].at,
    kpis: kpis(current),
    previous: before ? kpis(before) : null,
    activity: first ? activity(current, first, last, bucket) : [],
    tables: timesTables(current),
    addSub: addSub(current),
    mistakes: mistakes(wrong),
    slowest: slowest(current),
  };
  res.json(overview);
});

const SESSION_COLUMNS = `
  s.id, s.operations, s.questions_per_round AS "questionsPerRound", s.rounds_total AS "roundsTotal", s.settings,
  s.started_at AS "startedAt", s.finished_at AS "finishedAt",
  count(q.id)::int AS solved,
  (count(q.id) FILTER (WHERE q.wrong_attempts = 0))::int AS "firstTry",
  coalesce(sum(q.duration_ms), 0)::int AS "activeMs",
  percentile_cont(0.5) WITHIN GROUP (ORDER BY q.duration_ms) AS "medianMs"`;

api.get('/sessions', async (req, res) => {
  const { player, days, tz } = scope.parse(req.query);
  const id = await playerId(player);
  const first = days > 0 ? addDays(await today(tz), -(days - 1)) : '1970-01-01';
  const { rows } = await pool.query<SessionSummary>(
    `SELECT ${SESSION_COLUMNS}
       FROM sessions s LEFT JOIN questions q ON q.session_id = s.id
      WHERE s.player_id = $1 AND (s.started_at AT TIME ZONE $2)::date >= $3::date
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT 300`,
    [id, tz, first],
  );
  res.json(rows);
});

api.get('/sessions/:id', async (req, res) => {
  const sessionId = z.uuid().parse(req.params.id);
  const session = await pool.query<SessionSummary>(
    `SELECT ${SESSION_COLUMNS} FROM sessions s LEFT JOIN questions q ON q.session_id = s.id WHERE s.id = $1 GROUP BY s.id`,
    [sessionId],
  );
  if (!session.rowCount) throw new NotFound('no such session');
  const sums = await pool.query<SessionDetail['sums'][number]>(
    `SELECT q.round_number AS "roundNumber", q.position, q.operation AS op, q.operand_a AS a, q.operand_b AS b,
            q.correct_answer AS answer, q.duration_ms AS "durationMs",
            coalesce(json_agg(json_build_object('answer', a.answer, 'isCorrect', a.is_correct, 'elapsedMs', a.elapsed_ms)
                     ORDER BY a.attempt_number) FILTER (WHERE a.id IS NOT NULL), '[]') AS attempts
       FROM questions q LEFT JOIN attempts a ON a.question_id = q.id
      WHERE q.session_id = $1
      GROUP BY q.id
      ORDER BY q.round_number, q.position`,
    [sessionId],
  );
  const detail: SessionDetail = { ...session.rows[0], sums: sums.rows };
  res.json(detail);
});

api.get('/coins', async (req, res) => {
  const { player, days, tz } = scope.parse(req.query);
  const id = await playerId(player);
  const last = await today(tz);

  const purchases = await pool.query<{ id: string; itemId: string; price: number; purchasedAt: string }>(
    `SELECT id, item_id AS "itemId", price, purchased_at AS "purchasedAt" FROM purchases WHERE player_id = $1 ORDER BY purchased_at DESC`,
    [id],
  );
  const gifts = await pool.query<CoinsView['gifts'][number]>(
    `SELECT id, amount, note, created_at AS "createdAt" FROM coin_gifts WHERE player_id = $1 ORDER BY created_at DESC, id DESC`,
    [id],
  );
  const coinDays = await pool.query<CoinDay>(
    `SELECT day, sum(earned)::int AS earned, sum(gifted)::int AS gifted, sum(spent)::int AS spent FROM (
       SELECT ${localDay('q.solved_at', '$2')} AS day, 1 AS earned, 0 AS gifted, 0 AS spent
         FROM questions q JOIN sessions s ON s.id = q.session_id WHERE s.player_id = $1
       UNION ALL
       SELECT ${localDay('created_at', '$2')}, 0, amount, 0 FROM coin_gifts WHERE player_id = $1
       UNION ALL
       SELECT ${localDay('purchased_at', '$2')}, 0, 0, price FROM purchases WHERE player_id = $1
     ) changes GROUP BY day ORDER BY day`,
    [id, tz],
  );
  const state = await pool.query<{ key: string; value: unknown }>(`SELECT key, value FROM player_state WHERE player_id = $1`, [id]);
  const stateOf = (key: string) => state.rows.find((r) => r.key === key)?.value;

  const all = coinDays.rows;
  const earned = all.reduce((s, d) => s + d.earned, 0);
  const gifted = all.reduce((s, d) => s + d.gifted, 0);
  const spent = all.reduce((s, d) => s + d.spent, 0);
  const first = days > 0 ? addDays(last, -(days - 1)) : (all[0]?.day ?? last);
  const start = all.filter((d) => d.day < first).reduce((s, d) => s + d.earned + d.gifted - d.spent, 0);
  const goal = stateOf('goal');

  const coins: CoinsView = {
    player,
    earned,
    gifted,
    spent,
    balance: earned + gifted - spent,
    purchases: purchases.rows.map((p) => ({ ...p, name: itemById(p.itemId)?.name ?? p.itemId })),
    gifts: gifts.rows,
    balanceSeries: balanceSeries(start, all, first, last),
    goal: typeof goal === 'string' ? goal : null,
    avatar: stateOf('avatar') ?? null,
  };
  res.json(coins);
});

const gift = z.object({
  player: z.string().trim().min(1).max(50),
  amount: z.int().min(-1000).max(1000).refine((n) => n !== 0, 'amount must not be 0'),
  note: z.string().trim().max(120).optional(),
});

/** The one change the dashboard makes: give her coins (or take some back). She sees new gifts in the app. */
api.post('/gifts', async (req, res) => {
  const g = gift.parse(req.body);
  const id = await playerId(g.player);
  const db = await pool.connect();
  let broken: Error | undefined;
  try {
    await db.query('BEGIN READ WRITE');
    const { rows } = await db.query(
      `INSERT INTO coin_gifts (player_id, amount, note) VALUES ($1, $2, $3) RETURNING id, amount, note, created_at AS "createdAt"`,
      [id, g.amount, g.note || null],
    );
    await db.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    // If even the rollback fails the connection is broken: report the first error, and don't reuse it.
    await db.query('ROLLBACK').catch((rollbackErr: Error) => {
      broken = rollbackErr;
    });
    throw err;
  } finally {
    db.release(broken);
  }
});

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'invalid request', issues: err.issues });
    return;
  }
  if (err instanceof NotFound) {
    res.status(404).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'internal error' });
};
