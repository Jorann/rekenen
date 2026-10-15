import { uuid } from './uuid.ts';

export type Operation = 'add' | 'sub' | 'mul';

export interface Question {
  id: string;
  op: Operation;
  a: number;
  b: number;
  answer: number;
}

export interface GameSettings {
  operations: Operation[];
  /** Largest number used in + and − sums (operands and answer). */
  maxNumber: number;
  /** Which multiplication tables to practise (1–10). */
  tables: number[];
  questionsPerRound: number;
  rounds: number;
}

export const SYMBOL: Record<Operation, string> = { add: '+', sub: '−', mul: '×' };

type Rand = () => number;

/** Random integer in [min, max], both inclusive. */
function randInt(min: number, max: number, rand: Rand): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function pick<T>(items: readonly T[], rand: Rand): T {
  return items[Math.floor(rand() * items.length)];
}

export function makeSum(op: Operation, settings: GameSettings, rand: Rand = Math.random): Omit<Question, 'id'> {
  const max = Math.max(2, settings.maxNumber);
  switch (op) {
    case 'add': {
      // Both operands at least 1 and the answer never above max.
      const answer = randInt(2, max, rand);
      const a = randInt(1, answer - 1, rand);
      return { op, a, b: answer - a, answer };
    }
    case 'sub': {
      // Never a negative answer: b is at most a.
      const a = randInt(2, max, rand);
      const b = randInt(1, a, rand);
      return { op, a, b, answer: a - b };
    }
    case 'mul':
      return pick(timesTableSums(settings), rand);
  }
}

/** Every sum in the chosen tables, written the Dutch way for "de tafel van 7": 3 × 7. */
function timesTableSums(settings: GameSettings): Omit<Question, 'id'>[] {
  const tables = settings.tables.length ? settings.tables : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return tables.flatMap((table) =>
    Array.from({ length: 10 }, (_, i) => ({ op: 'mul' as const, a: i + 1, b: table, answer: (i + 1) * table })),
  );
}

function shuffle<T>(items: T[], rand: Rand): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** One round of sums, without repeats unless the round asks for more sums than exist. */
export function makeRound(settings: GameSettings, rand: Rand = Math.random): Question[] {
  // Times tables are a small set, so deal them from a shuffled deck; + and − have plenty of variety.
  let deck: Omit<Question, 'id'>[] = [];
  const seen = new Set<string>();
  const round: Question[] = [];
  for (let i = 0; i < settings.questionsPerRound; i++) {
    const op = pick(settings.operations, rand);
    let sum: Omit<Question, 'id'>;
    if (op === 'mul') {
      if (!deck.length) deck = shuffle(timesTableSums(settings), rand);
      sum = deck.pop()!;
    } else {
      sum = makeSum(op, settings, rand);
      for (let tries = 0; tries < 50 && seen.has(key(sum)); tries++) sum = makeSum(op, settings, rand);
    }
    seen.add(key(sum));
    round.push({ id: uuid(), ...sum });
  }
  return round;
}

function key(q: Omit<Question, 'id'>): string {
  return `${q.op}:${q.a}:${q.b}`;
}
