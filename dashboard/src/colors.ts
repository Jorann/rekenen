import type { Operation } from '../server/stats.ts';

/**
 * Chart colours are CSS variables (styles.css), so light and dark mode each get their own steps.
 * The three kinds of sums use the first three slots of the validated categorical palette:
 * colour-blind safe as a set, in both modes. Minus keeps the app's blue; plus is the warm one.
 */
export const OP_COLOR: Record<Operation, string> = {
  sub: 'var(--series-1)',
  add: 'var(--series-2)',
  mul: 'var(--series-3)',
};

/** The single colour for one-series charts. */
export const ACCENT = 'var(--series-1)';

/** The five steps of the one-hue scale for the times-table grid, easy to hard (validated as an ordinal ramp). */
export const SEQ = Array.from({ length: 5 }, (_, i) => `var(--seq-${i + 1})`);
