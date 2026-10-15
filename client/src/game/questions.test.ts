import { describe, expect, it } from 'vitest';
import { makeRound, makeSum, type GameSettings } from './questions.ts';

const base: GameSettings = {
  operations: ['add', 'sub', 'mul'],
  maxNumber: 100,
  tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  questionsPerRound: 10,
  rounds: 1,
};

const N = 5000;

describe('makeSum', () => {
  it('addition stays within the limit and uses positive operands', () => {
    for (const maxNumber of [20, 50, 100]) {
      for (let i = 0; i < N; i++) {
        const q = makeSum('add', { ...base, maxNumber });
        expect(q.a).toBeGreaterThanOrEqual(1);
        expect(q.b).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBe(q.a + q.b);
        expect(q.answer).toBeLessThanOrEqual(maxNumber);
      }
    }
  });

  it('subtraction never goes negative and stays within the limit', () => {
    for (const maxNumber of [20, 50, 100]) {
      for (let i = 0; i < N; i++) {
        const q = makeSum('sub', { ...base, maxNumber });
        expect(q.a).toBeLessThanOrEqual(maxNumber);
        expect(q.b).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBe(q.a - q.b);
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('multiplication only uses the chosen tables, times 1 to 10', () => {
    const tables = [3, 7];
    for (let i = 0; i < N; i++) {
      const q = makeSum('mul', { ...base, tables });
      expect(tables).toContain(q.b);
      expect(q.a).toBeGreaterThanOrEqual(1);
      expect(q.a).toBeLessThanOrEqual(10);
      expect(q.answer).toBe(q.a * q.b);
    }
  });

  it('covers the whole range, including the edges', () => {
    const answers = new Set<number>();
    for (let i = 0; i < 20000; i++) answers.add(makeSum('add', base).answer);
    expect(answers.has(2)).toBe(true);
    expect(answers.has(100)).toBe(true);
  });
});

describe('makeRound', () => {
  it('makes the requested number of sums with unique ids', () => {
    const round = makeRound({ ...base, questionsPerRound: 12 });
    expect(round).toHaveLength(12);
    expect(new Set(round.map((q) => q.id)).size).toBe(12);
  });

  it('avoids repeating a sum within a round', () => {
    for (let i = 0; i < 200; i++) {
      const round = makeRound({ ...base, operations: ['mul'], tables: [4], questionsPerRound: 10 });
      expect(new Set(round.map((q) => `${q.a}x${q.b}`)).size).toBe(10);
    }
  });

  it('only uses the chosen operations', () => {
    const round = makeRound({ ...base, operations: ['sub'], questionsPerRound: 50 });
    expect(round.every((q) => q.op === 'sub')).toBe(true);
  });
});
