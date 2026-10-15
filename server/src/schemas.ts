import { z } from 'zod';

export const operation = z.enum(['add', 'sub', 'mul']);

export const createSession = z.object({
  id: z.uuid(),
  playerName: z.string().trim().min(1).max(50),
  operations: z.array(operation).min(1),
  questionsPerRound: z.int().min(1).max(100),
  roundsTotal: z.int().min(1).max(50),
  settings: z.record(z.string(), z.unknown()).default({}),
  startedAt: z.iso.datetime(),
});

const attempt = z.object({
  answer: z.int().min(0),
  isCorrect: z.boolean(),
  elapsedMs: z.int().min(0),
  attemptedAt: z.iso.datetime(),
});

export const solvedQuestion = z
  .object({
    id: z.uuid(),
    roundNumber: z.int().min(1),
    position: z.int().min(1),
    operation,
    operandA: z.int().min(0),
    operandB: z.int().min(0),
    correctAnswer: z.int().min(0),
    shownAt: z.iso.datetime(),
    solvedAt: z.iso.datetime(),
    durationMs: z.int().min(0),
    attempts: z.array(attempt).min(1),
  })
  .refine((q) => q.attempts.at(-1)?.isCorrect, { message: 'last attempt must be the correct one' });

export const finishSession = z.object({
  finishedAt: z.iso.datetime(),
});

export type CreateSession = z.infer<typeof createSession>;
export type SolvedQuestion = z.infer<typeof solvedQuestion>;
