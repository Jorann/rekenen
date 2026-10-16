import type { AddSubGroup } from '../../server/stats.ts';
import { ChartCard, DataTable } from '../charts/ChartCard.tsx';
import { HBars } from '../charts/HBars.tsx';
import { OP_COLOR } from '../colors.ts';
import { num, OP_NAME, OP_SYMBOL, pct, secs } from '../format.ts';

const label = (g: AddSubGroup) => `${OP_SYMBOL[g.op]} ${g.crossesTen ? 'over het tiental' : 'niet over het tiental'}`;
const LEGEND = (['add', 'sub'] as const).map((op) => ({ label: OP_NAME[op], color: OP_COLOR[op] }));

/**
 * Plus and min, split by whether the sum goes over a ten (8 + 5, 23 − 7): the step that is hard at first.
 * Two charts, one per measure, never two scales on one chart.
 */
export function AddSub({ groups }: { groups: AddSubGroup[] }) {
  if (!groups.some((g) => g.n)) return null;
  const tip = (g: AddSubGroup) =>
    g.n
      ? [
          { value: pct(g.firstTry), label: 'in één keer goed' },
          { value: secs(g.medianMs), label: 'per som' },
          { value: num(g.n), label: 'sommen' },
        ]
      : [];
  const table = (
    <DataTable
      head={['Soort som', 'Sommen', 'In één keer goed', 'Tijd per som']}
      numeric={[1, 2, 3]}
      rows={groups.map((g) => [label(g), g.n, pct(g.firstTry), secs(g.medianMs)])}
    />
  );
  const maxTime = Math.max(1, ...groups.map((g) => g.medianMs ?? 0));

  return (
    <>
      <ChartCard title="Plus en min: in één keer goed" subtitle="Met en zonder over het tiental" legend={LEGEND} table={table}>
        <HBars max={1} format={(v) => pct(v)} rows={groups.map((g) => ({ label: label(g), value: g.firstTry, color: OP_COLOR[g.op], tip: tip(g) }))} />
      </ChartCard>
      <ChartCard title="Plus en min: tijd per som" subtitle="Mediaan" legend={LEGEND} table={table}>
        <HBars max={maxTime} format={(v) => secs(v)} rows={groups.map((g) => ({ label: label(g), value: g.medianMs, color: OP_COLOR[g.op], tip: tip(g) }))} />
      </ChartCard>
    </>
  );
}
