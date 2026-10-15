import { Router, type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { pool } from './db.ts';
import { createSession, finishSession, solvedQuestion } from './schemas.ts';

export const api = Router();

api.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

// All writes are idempotent (client-generated ids), because the iPad retries until the server has them.

api.post('/sessions', async (req, res) => {
  const s = createSession.parse(req.body);
  await pool.query(
    `WITH player AS (
       INSERT INTO players (name) VALUES ($2)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id
     )
     INSERT INTO sessions (id, player_id, operations, questions_per_round, rounds_total, settings, started_at)
     SELECT $1, player.id, $3, $4, $5, $6, $7 FROM player
     ON CONFLICT (id) DO NOTHING`,
    [s.id, s.playerName, s.operations, s.questionsPerRound, s.roundsTotal, s.settings, s.startedAt],
  );
  res.status(201).json({ id: s.id });
});

api.post('/sessions/:id/questions', async (req, res) => {
  const sessionId = z.uuid().parse(req.params.id);
  const q = solvedQuestion.parse(req.body);
  const wrongAttempts = q.attempts.filter((a) => !a.isCorrect).length;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO questions (id, session_id, round_number, position, operation, operand_a, operand_b,
                              correct_answer, shown_at, solved_at, duration_ms, wrong_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [q.id, sessionId, q.roundNumber, q.position, q.operation, q.operandA, q.operandB,
        q.correctAnswer, q.shownAt, q.solvedAt, q.durationMs, wrongAttempts],
    );
    if (inserted.rowCount === 1) {
      for (const [i, a] of q.attempts.entries()) {
        await client.query(
          `INSERT INTO attempts (question_id, attempt_number, answer, is_correct, elapsed_ms, attempted_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [q.id, i + 1, a.answer, a.isCorrect, a.elapsedMs, a.attemptedAt],
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.status(201).json({ id: q.id });
});

api.post('/sessions/:id/finish', async (req, res) => {
  const sessionId = z.uuid().parse(req.params.id);
  const { finishedAt } = finishSession.parse(req.body);
  await pool.query(
    'UPDATE sessions SET finished_at = COALESCE(finished_at, $2) WHERE id = $1',
    [sessionId, finishedAt],
  );
  res.json({ id: sessionId });
});

// Read endpoints, for the parent dashboard that comes later.

api.get('/sessions', async (req, res) => {
  const limit = z.coerce.number().int().min(1).max(500).default(50).parse(req.query.limit);
  const { rows } = await pool.query(
    `SELECT s.id, p.name AS player_name, s.operations, s.questions_per_round, s.rounds_total,
            s.settings, s.started_at, s.finished_at,
            count(q.id)::int                 AS questions_solved,
            coalesce(sum(q.wrong_attempts), 0)::int AS wrong_attempts,
            round(avg(q.duration_ms))::int   AS avg_duration_ms
       FROM sessions s
       JOIN players p ON p.id = s.player_id
       LEFT JOIN questions q ON q.session_id = s.id
      GROUP BY s.id, p.name
      ORDER BY s.started_at DESC
      LIMIT $1`,
    [limit],
  );
  res.json(rows);
});

api.get('/sessions/:id', async (req, res) => {
  const sessionId = z.uuid().parse(req.params.id);
  const session = await pool.query(
    `SELECT s.*, p.name AS player_name FROM sessions s JOIN players p ON p.id = s.player_id WHERE s.id = $1`,
    [sessionId],
  );
  if (session.rowCount === 0) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const questions = await pool.query(
    `SELECT q.*,
            coalesce(json_agg(json_build_object(
              'attempt_number', a.attempt_number, 'answer', a.answer, 'is_correct', a.is_correct,
              'elapsed_ms', a.elapsed_ms, 'attempted_at', a.attempted_at)
              ORDER BY a.attempt_number) FILTER (WHERE a.id IS NOT NULL), '[]') AS attempts
       FROM questions q
       LEFT JOIN attempts a ON a.question_id = q.id
      WHERE q.session_id = $1
      GROUP BY q.id
      ORDER BY q.round_number, q.position`,
    [sessionId],
  );
  res.json({ ...session.rows[0], questions: questions.rows });
});

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'invalid request', issues: err.issues });
    return;
  }
  // 23503: foreign key violation, e.g. a question for a session the server never received.
  if (err?.code === '23503') {
    res.status(409).json({ error: err.detail ?? 'missing parent row' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'internal error' });
};
