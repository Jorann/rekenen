import type { Bucket, Overview } from '../../server/stats.ts';
import { ChartCard, DataTable } from '../charts/ChartCard.tsx';
import { Columns } from '../charts/Columns.tsx';
import { LineChart } from '../charts/Line.tsx';
import { ACCENT, OP_COLOR } from '../colors.ts';
import { dayLabel, dayShortLabel, num, OP_NAME, pct, secs, weekdayLabel, weekLabel } from '../format.ts';

const SERIES = (['add', 'sub', 'mul'] as const).map((op) => ({ key: op, label: OP_NAME[op], color: OP_COLOR[op] }));

const total = (b: Bucket) => b.add + b.sub + b.mul;

/** How much she practised per day (or week), and how it went. */
export function Activity({ overview }: { overview: Overview }) {
  const days = overview.activity;
  const perWeek = overview.bucket === 'week';
  const short = days.length <= 8;
  const xLabel = perWeek ? dayShortLabel : short ? weekdayLabel : dayShortLabel;
  const title = perWeek ? weekLabel : dayLabel;
  const when = perWeek ? 'Week' : 'Dag';

  return (
    <>
      <ChartCard
        className="wide"
        title={perWeek ? 'Sommen per week' : 'Sommen per dag'}
        legend={SERIES.map((s) => ({ label: s.label, color: s.color }))}
        table={
          <DataTable
            head={[when, 'Plus', 'Min', 'Keer', 'Samen']}
            numeric={[1, 2, 3, 4]}
            rows={days.map((d) => [title(d.key), d.add, d.sub, d.mul, total(d)])}
          />
        }
      >
        <Columns
          data={days.map((d) => ({ key: d.key, values: { add: d.add, sub: d.sub, mul: d.mul } }))}
          series={SERIES}
          xLabel={xLabel}
          tipTitle={title}
        />
      </ChartCard>

      <ChartCard
        title="In één keer goed"
        subtitle="Deel van de sommen zonder fout antwoord"
        table={
          <DataTable head={[when, 'In één keer goed', 'Sommen']} numeric={[1, 2]} rows={days.filter(total).map((d) => [title(d.key), pct(d.firstTry), total(d)])} />
        }
      >
        <LineChart
          data={days.map((d) => ({ key: d.key, value: d.firstTry }))}
          color={ACCENT}
          max={1}
          format={(v) => pct(v)}
          xLabel={xLabel}
          tipTitle={title}
          tipRows={(i) => [
            { value: pct(days[i].firstTry), label: 'in één keer goed' },
            { value: num(total(days[i])), label: 'sommen' },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Tijd per som"
        subtitle="Mediaan: de helft van de sommen ging sneller"
        table={<DataTable head={[when, 'Tijd per som', 'Sommen']} numeric={[1, 2]} rows={days.filter(total).map((d) => [title(d.key), secs(d.medianMs), total(d)])} />}
      >
        <LineChart
          data={days.map((d) => ({ key: d.key, value: d.medianMs }))}
          color={ACCENT}
          format={(v) => secs(v)}
          tickFormat={(v) => `${v / 1000} s`}
          xLabel={xLabel}
          tipTitle={title}
          tipRows={(i) => [
            { value: secs(days[i].medianMs), label: 'per som' },
            { value: num(total(days[i])), label: 'sommen' },
          ]}
        />
      </ChartCard>
    </>
  );
}
