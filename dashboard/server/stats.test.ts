import { describe, expect, it } from 'vitest';
import { activity, addSub, balanceSeries, bucketSize, crossesTen, dateRange, kpis, median, mistakes, mondayOf, slowest, timesTables, type SumRow } from './stats.ts';

function sum(op: SumRow['op'], a: number, b: number, extra: Partial<SumRow> = {}): SumRow {
  const answer = op === 'add' ? a + b : op === 'sub' ? a - b : a * b;
  return { sessionId: 's1', op, a, b, answer, durationMs: 3000, wrong: 0, day: '2026-10-12', week: '2026-10-12', ...extra };
}

describe('median', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe('kpis', () => {
  it('counts sums, first tries, practice time, days and sessions', () => {
    const k = kpis([
      sum('add', 2, 3, { durationMs: 2000 }),
      sum('add', 4, 4, { wrong: 2, durationMs: 6000 }),
      sum('mul', 3, 7, { day: '2026-10-13', sessionId: 's2', durationMs: 4000 }),
    ]);
    expect(k).toEqual({ solved: 3, firstTry: 2 / 3, medianMs: 4000, activeMs: 12000, daysPractised: 2, sessions: 2 });
  });

  it('has no rates without sums', () => {
    expect(kpis([])).toMatchObject({ solved: 0, firstTry: null, medianMs: null });
  });
});

describe('dates', () => {
  it('lists every day, also across a month and a DST change', () => {
    expect(dateRange('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('finds the Monday of a week', () => {
    expect(mondayOf('2026-10-16')).toBe('2026-10-12'); // a Friday
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
    expect(mondayOf('2026-10-18')).toBe('2026-10-12'); // Sunday belongs to the week before
  });

  it('switches to weeks for long periods', () => {
    expect(bucketSize('2026-09-17', '2026-10-16')).toBe('day');
    expect(bucketSize('2026-07-18', '2026-10-16')).toBe('week');
  });
});

describe('activity', () => {
  it('includes empty days and splits by kind of sum', () => {
    const rows = [sum('add', 1, 1), sum('mul', 2, 3), sum('mul', 3, 3, { day: '2026-10-14' })];
    const days = activity(rows, '2026-10-12', '2026-10-14', 'day');
    expect(days.map((d) => [d.key, d.add, d.sub, d.mul])).toEqual([
      ['2026-10-12', 1, 0, 1],
      ['2026-10-13', 0, 0, 0],
      ['2026-10-14', 0, 0, 1],
    ]);
    expect(days[1].firstTry).toBeNull();
  });

  it('groups by week when asked', () => {
    const rows = [sum('add', 1, 1, { week: '2026-10-05' }), sum('add', 1, 2, { week: '2026-10-12' })];
    const weeks = activity(rows, '2026-10-07', '2026-10-16', 'week');
    expect(weeks.map((w) => [w.key, w.add])).toEqual([
      ['2026-10-05', 1],
      ['2026-10-12', 1],
    ]);
  });
});

describe('timesTables', () => {
  it('fills a 10 × 10 grid, with the table as b', () => {
    const { cells, tables } = timesTables([sum('mul', 8, 7, { wrong: 1 }), sum('mul', 8, 7), sum('add', 8, 7)]);
    expect(cells).toHaveLength(100);
    expect(cells.find((c) => c.a === 8 && c.b === 7)).toMatchObject({ n: 2, firstTry: 0.5 });
    expect(tables.find((t) => t.table === 7)).toMatchObject({ n: 2 });
    expect(tables.find((t) => t.table === 8)).toMatchObject({ n: 0, firstTry: null });
  });
});

describe('addSub', () => {
  it('knows which sums go over a ten', () => {
    expect(crossesTen('add', 8, 5)).toBe(true);
    expect(crossesTen('add', 23, 14)).toBe(false);
    expect(crossesTen('sub', 23, 7)).toBe(true);
    expect(crossesTen('sub', 48, 25)).toBe(false);
  });

  it('makes four groups', () => {
    const groups = addSub([sum('add', 8, 5), sum('add', 2, 3), sum('sub', 23, 7)]);
    expect(groups.map((g) => [g.op, g.crossesTen, g.n])).toEqual([
      ['add', false, 1],
      ['add', true, 1],
      ['sub', false, 0],
      ['sub', true, 1],
    ]);
  });
});

describe('mistakes and slow sums', () => {
  it('ranks the most common wrong answers', () => {
    const top = mistakes([
      { op: 'mul', a: 7, b: 8, wrongAnswer: 54 },
      { op: 'mul', a: 7, b: 8, wrongAnswer: 54 },
      { op: 'mul', a: 6, b: 7, wrongAnswer: 43 },
    ]);
    expect(top[0]).toEqual({ op: 'mul', a: 7, b: 8, wrongAnswer: 54, count: 2 });
    expect(top).toHaveLength(2);
  });

  it('ranks times-table sums she did more than once by their median time', () => {
    const slow = slowest([
      sum('mul', 7, 8, { durationMs: 9000 }),
      sum('mul', 7, 8, { durationMs: 7000 }),
      sum('mul', 2, 2, { durationMs: 1000 }),
      sum('mul', 2, 2, { durationMs: 1200 }),
      sum('mul', 9, 9, { durationMs: 20000 }),
      sum('add', 38, 45, { durationMs: 30000 }),
      sum('add', 38, 45, { durationMs: 30000 }),
    ]);
    expect(slow.map((s) => [s.a, s.b, s.medianMs])).toEqual([
      [7, 8, 8000],
      [2, 2, 1100],
    ]);
  });
});

describe('balanceSeries', () => {
  it('carries the balance over days without changes', () => {
    const series = balanceSeries(10, [
      { day: '2026-10-12', earned: 15, gifted: 0, spent: 20 },
      { day: '2026-10-14', earned: 5, gifted: 25, spent: 0 },
    ], '2026-10-12', '2026-10-14');
    expect(series).toEqual([
      { day: '2026-10-12', balance: 5 },
      { day: '2026-10-13', balance: 5 },
      { day: '2026-10-14', balance: 35 },
    ]);
  });
});
