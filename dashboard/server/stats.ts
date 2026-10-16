/**
 * Turns rows of solved sums into what the dashboard shows. Pure functions, no database:
 * the queries in routes.ts fetch the rows (with days already in the viewer's time zone).
 * The web app imports these types too.
 */

export type Operation = 'add' | 'sub' | 'mul';
export const OPERATIONS: readonly Operation[] = ['add', 'sub', 'mul'];

/** One solved sum. day and week (its Monday) are local dates, 'YYYY-MM-DD'. */
export interface SumRow {
  sessionId: string;
  op: Operation;
  a: number;
  b: number;
  answer: number;
  durationMs: number;
  wrong: number;
  day: string;
  week: string;
}

/** One wrong answer she gave. */
export interface WrongRow {
  op: Operation;
  a: number;
  b: number;
  wrongAnswer: number;
}

export interface Kpis {
  solved: number;
  /** Share solved at the first try, 0–1; null without sums. */
  firstTry: number | null;
  medianMs: number | null;
  /** Time spent on sums (shown → solved), without time the iPad was locked. */
  activeMs: number;
  daysPractised: number;
  sessions: number;
}

export interface Bucket {
  /** The day, or the Monday of the week. */
  key: string;
  add: number;
  sub: number;
  mul: number;
  firstTry: number | null;
  medianMs: number | null;
  activeMs: number;
}

export interface Measure {
  n: number;
  firstTry: number | null;
  medianMs: number | null;
}

/** One times-table sum, a × b, where b is the table ("de tafel van b"). */
export interface TableCell extends Measure {
  a: number;
  b: number;
}

export interface TableRow extends Measure {
  table: number;
}

export interface AddSubGroup extends Measure {
  op: 'add' | 'sub';
  /** Goes over a ten: 8 + 5, 23 − 7. */
  crossesTen: boolean;
}

export interface Mistake {
  op: Operation;
  a: number;
  b: number;
  wrongAnswer: number;
  count: number;
}

export interface SlowSum extends Measure {
  op: Operation;
  a: number;
  b: number;
}

export function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function measure(rows: readonly SumRow[]): Measure {
  return {
    n: rows.length,
    firstTry: rows.length ? rows.filter((r) => r.wrong === 0).length / rows.length : null,
    medianMs: median(rows.map((r) => r.durationMs)),
  };
}

export function kpis(rows: readonly SumRow[]): Kpis {
  const m = measure(rows);
  return {
    solved: m.n,
    firstTry: m.firstTry,
    medianMs: m.medianMs,
    activeMs: rows.reduce((sum, r) => sum + r.durationMs, 0),
    daysPractised: new Set(rows.map((r) => r.day)).size,
    sessions: new Set(rows.map((r) => r.sessionId)).size,
  };
}

/** Every date from first to last (inclusive), 'YYYY-MM-DD'. */
export function dateRange(first: string, last: string, stepDays = 1): string[] {
  const out: string[] = [];
  const end = Date.parse(`${last}T00:00:00Z`);
  for (let t = Date.parse(`${first}T00:00:00Z`); t <= end; t += stepDays * 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** The Monday of a date's week. */
export function mondayOf(date: string): string {
  const t = Date.parse(`${date}T00:00:00Z`);
  const weekday = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
  return new Date(t - weekday * 86_400_000).toISOString().slice(0, 10);
}

/** Days are fine for a month or two; longer periods are shown per week. */
export function bucketSize(first: string, last: string): 'day' | 'week' {
  return dateRange(first, last).length > 45 ? 'week' : 'day';
}

/** Sums per day (or week) from first to last, including the days she didn't practise. */
export function activity(rows: readonly SumRow[], first: string, last: string, size: 'day' | 'week'): Bucket[] {
  const keys = size === 'day' ? dateRange(first, last) : dateRange(mondayOf(first), mondayOf(last), 7);
  const groups = new Map<string, SumRow[]>(keys.map((k) => [k, []]));
  for (const r of rows) groups.get(size === 'day' ? r.day : r.week)?.push(r);
  return keys.map((key) => {
    const g = groups.get(key)!;
    const m = measure(g);
    return {
      key,
      add: g.filter((r) => r.op === 'add').length,
      sub: g.filter((r) => r.op === 'sub').length,
      mul: g.filter((r) => r.op === 'mul').length,
      firstTry: m.firstTry,
      medianMs: m.medianMs,
      activeMs: g.reduce((sum, r) => sum + r.durationMs, 0),
    };
  });
}

/** The 10 × 10 grid of times-table sums, and a summary per table. */
export function timesTables(rows: readonly SumRow[]): { cells: TableCell[]; tables: TableRow[] } {
  const mul = rows.filter((r) => r.op === 'mul');
  const cells: TableCell[] = [];
  const tables: TableRow[] = [];
  for (let b = 1; b <= 10; b++) {
    const ofTable = mul.filter((r) => r.b === b);
    tables.push({ table: b, ...measure(ofTable) });
    for (let a = 1; a <= 10; a++) cells.push({ a, b, ...measure(ofTable.filter((r) => r.a === a)) });
  }
  return { cells, tables };
}

/** Whether a + or − sum goes over a ten, the step that is hard at first. */
export function crossesTen(op: 'add' | 'sub', a: number, b: number): boolean {
  return op === 'add' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
}

export function addSub(rows: readonly SumRow[]): AddSubGroup[] {
  const groups: AddSubGroup[] = [];
  for (const op of ['add', 'sub'] as const) {
    for (const crosses of [false, true]) {
      const g = rows.filter((r) => r.op === op && crossesTen(op, r.a, r.b) === crosses);
      groups.push({ op, crossesTen: crosses, ...measure(g) });
    }
  }
  return groups;
}

/** The wrong answers she gave most often. */
export function mistakes(wrong: readonly WrongRow[], limit = 8): Mistake[] {
  const counts = new Map<string, Mistake>();
  for (const w of wrong) {
    const key = `${w.op}:${w.a}:${w.b}:${w.wrongAnswer}`;
    const m = counts.get(key) ?? { ...w, count: 0 };
    m.count++;
    counts.set(key, m);
  }
  return [...counts.values()].sort((x, y) => y.count - x.count || x.a - y.a || x.b - y.b).slice(0, limit);
}

/**
 * The times-table sums that take her longest (by median time). Only sums she did at least twice:
 * one slow try says little. Plus and min aren't listed, most of those sums come up only once.
 */
export function slowest(rows: readonly SumRow[], limit = 8, minCount = 2): SlowSum[] {
  const groups = new Map<string, SumRow[]>();
  for (const r of rows) {
    if (r.op !== 'mul') continue;
    const key = `${r.op}:${r.a}:${r.b}`;
    const group = groups.get(key);
    if (group) group.push(r);
    else groups.set(key, [r]);
  }
  return [...groups.values()]
    .filter((g) => g.length >= minCount)
    .map((g) => ({ op: g[0].op, a: g[0].a, b: g[0].b, ...measure(g) }))
    .sort((x, y) => (y.medianMs ?? 0) - (x.medianMs ?? 0))
    .slice(0, limit);
}

/** Change of each coin source per day, to draw the balance over time. */
export interface CoinDay {
  day: string;
  earned: number;
  gifted: number;
  spent: number;
}

export interface BalancePoint {
  day: string;
  balance: number;
}

/** The balance at the end of each day from first to last, starting from the balance before first. */
export function balanceSeries(start: number, days: readonly CoinDay[], first: string, last: string): BalancePoint[] {
  const byDay = new Map(days.map((d) => [d.day, d]));
  let balance = start;
  return dateRange(first, last).map((day) => {
    const d = byDay.get(day);
    if (d) balance += d.earned + d.gifted - d.spent;
    return { day, balance };
  });
}

export interface Overview {
  player: string;
  /** First and last day of the period (local dates), or null when there are no sums at all yet. */
  first: string | null;
  last: string;
  bucket: 'day' | 'week';
  lastPlayed: string | null;
  kpis: Kpis;
  /** The same numbers for the period just before, for comparison; null for "everything". */
  previous: Kpis | null;
  activity: Bucket[];
  tables: { cells: TableCell[]; tables: TableRow[] };
  addSub: AddSubGroup[];
  mistakes: Mistake[];
  slowest: SlowSum[];
}

export interface SessionSummary {
  id: string;
  operations: Operation[];
  questionsPerRound: number;
  roundsTotal: number;
  settings: { maxNumber?: number; tables?: number[] };
  startedAt: string;
  finishedAt: string | null;
  solved: number;
  firstTry: number;
  activeMs: number;
  medianMs: number | null;
}

export interface SessionDetail extends SessionSummary {
  sums: {
    roundNumber: number;
    position: number;
    op: Operation;
    a: number;
    b: number;
    answer: number;
    durationMs: number;
    attempts: { answer: number; isCorrect: boolean; elapsedMs: number }[];
  }[];
}

export interface CoinsView {
  player: string;
  earned: number;
  gifted: number;
  spent: number;
  balance: number;
  purchases: { id: string; itemId: string; name: string; price: number; purchasedAt: string }[];
  gifts: { id: number; amount: number; note: string | null; createdAt: string }[];
  balanceSeries: BalancePoint[];
  goal: string | null;
  avatar: unknown;
}

export interface PlayerSummary {
  name: string;
  solved: number;
  lastPlayed: string | null;
}
