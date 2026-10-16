/**
 * Fills a TEST database with eight weeks of made-up practice, to try the dashboard:
 *   DATABASE_URL=postgres://rekenen:rekenen@localhost:5433/rekenen_test npm run seed:demo -w dashboard [-- name]
 * Refuses any database whose name doesn't end in _test or _demo, so Nomi's real data is safe.
 * The tables must exist: start the app server against the same database once first.
 */
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const url = process.env.DATABASE_URL ?? '';
const dbName = new URL(url).pathname.slice(1);
if (!/_(test|demo)$/.test(dbName)) {
  console.error(`Refusing to seed "${dbName}": only databases ending in _test or _demo.`);
  process.exit(1);
}
const player = process.argv[2] ?? 'Nomi';
const db = new pg.Client({ connectionString: url });
await db.connect();

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const chance = (p: number) => Math.random() < p;

// How hard a times-table sum is for her: 1 (easy) to 3 (hard), and she gets better over the weeks.
const tableDifficulty: Record<number, number> = { 1: 1, 2: 1, 10: 1, 5: 1.3, 3: 1.8, 4: 1.9, 6: 2.4, 9: 2.4, 8: 2.8, 7: 3 };

function makeSum(op: 'add' | 'sub' | 'mul', max: number) {
  if (op === 'mul') {
    const b = rand(1, 10);
    const a = rand(1, 10);
    return { op, a, b, answer: a * b, difficulty: tableDifficulty[b] * (a > 5 ? 1.2 : 1) };
  }
  if (op === 'add') {
    const answer = rand(2, max);
    const a = rand(1, answer - 1);
    const b = answer - a;
    return { op, a, b, answer, difficulty: 1 + (((a % 10) + (b % 10) >= 10) ? 1.2 : 0) + answer / 100 };
  }
  const a = rand(2, max);
  const b = rand(1, a);
  return { op, a, b, answer: a - b, difficulty: 1.2 + (a % 10 < b % 10 ? 1.4 : 0) + a / 100 };
}

const { rows: [p] } = await db.query<{ id: number }>(
  `INSERT INTO players (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
  [player],
);
await db.query('BEGIN');
let sums = 0;
const weeks = 8;
for (let day = weeks * 7; day >= 0; day--) {
  if (!chance(0.72)) continue;
  const progress = 1 - day / (weeks * 7); // 0 at the start, 1 today
  for (let s = 0; s < rand(1, 2); s++) {
    const ops: ('add' | 'sub' | 'mul')[] = progress < 0.3 ? ['add', 'sub'] : chance(0.5) ? ['mul'] : ['add', 'sub', 'mul'];
    const max = progress < 0.3 ? 20 : progress < 0.6 ? 50 : 100;
    const perRound = rand(5, 10);
    const rounds = rand(2, 4);
    const start = new Date(Date.now() - day * 86_400_000);
    start.setHours(rand(15, 19), rand(0, 59), 0, 0);
    if (start.getTime() > Date.now()) start.setTime(Date.now() - 3_600_000);
    const sessionId = randomUUID();
    await db.query(
      `INSERT INTO sessions (id, player_id, operations, questions_per_round, rounds_total, settings, started_at, finished_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sessionId, p.id, ops, perRound, rounds, { maxNumber: max, tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, start, null],
    );
    let t = start.getTime();
    for (let round = 1; round <= rounds; round++) {
      for (let pos = 1; pos <= perRound; pos++) {
        const q = makeSum(ops[rand(0, ops.length - 1)], max);
        const skill = 1.5 - progress * 0.7;
        const wrongs = chance(Math.min(0.6, 0.05 * q.difficulty * q.difficulty * skill)) ? (chance(0.3) ? 2 : 1) : 0;
        const attempts = [];
        let elapsed = 0;
        for (let w = 0; w < wrongs; w++) {
          elapsed += Math.round((1500 + Math.random() * 2500) * q.difficulty * skill);
          const near = q.op === 'mul' ? q.answer + (chance(0.5) ? q.b : -q.b) * (chance(0.5) ? 1 : 0) + rand(-2, 2) : q.answer + (chance(0.5) ? 10 : 1) * (chance(0.5) ? 1 : -1);
          attempts.push({ answer: Math.max(0, near === q.answer ? q.answer + 1 : near), isCorrect: false, elapsed });
        }
        elapsed += Math.round((1200 + Math.random() * 2600) * q.difficulty * skill);
        attempts.push({ answer: q.answer, isCorrect: true, elapsed });
        const qid = randomUUID();
        await db.query(
          `INSERT INTO questions (id, session_id, round_number, position, operation, operand_a, operand_b, correct_answer, shown_at, solved_at, duration_ms, wrong_attempts)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [qid, sessionId, round, pos, q.op, q.a, q.b, q.answer, new Date(t), new Date(t + elapsed), elapsed, wrongs],
        );
        for (const [i, a] of attempts.entries()) {
          await db.query(
            `INSERT INTO attempts (question_id, attempt_number, answer, is_correct, elapsed_ms, attempted_at) VALUES ($1, $2, $3, $4, $5, $6)`,
            [qid, i + 1, a.answer, a.isCorrect, a.elapsed, new Date(t + a.elapsed)],
          );
        }
        t += elapsed + 1500;
        sums++;
      }
    }
    await db.query('UPDATE sessions SET finished_at = $2 WHERE id = $1', [sessionId, chance(0.9) ? new Date(t) : null]);
  }
}
await db.query('COMMIT');
console.log(`Added ${sums} sums for ${player} to ${dbName}.`);
await db.end();
