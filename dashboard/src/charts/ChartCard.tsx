import { useState, type ReactNode } from 'react';

export interface LegendItem {
  label: string;
  color: string;
  /** Mirrors the mark: a block for bars and cells, a line for lines. */
  shape?: 'rect' | 'line';
}

/**
 * A chart in a card: title, optional legend, and a button to see the same numbers as a table
 * (the accessible twin of every chart, and where every value can be read without hovering).
 */
export function ChartCard({
  title,
  subtitle,
  legend,
  table,
  actions,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  table?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className={`card chart-card${className ? ` ${className}` : ''}`}>
      <header className="card-head">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        <div className="card-actions">
          {actions}
          {table && (
            <button className="ghost-btn" onClick={() => setAsTable(!asTable)} aria-pressed={asTable}>
              {asTable ? 'Grafiek' : 'Tabel'}
            </button>
          )}
        </div>
      </header>
      {legend && legend.length > 1 && !asTable && (
        <ul className="legend">
          {legend.map((l) => (
            <li key={l.label}>
              <span className={l.shape === 'line' ? 'line-key' : 'rect-key'} style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      {asTable ? <div className="table-view">{table}</div> : children}
    </figure>
  );
}

/** A plain table, for the table view of a chart and for lists. */
export function DataTable({ head, rows, numeric = [] }: { head: string[]; rows: ReactNode[][]; numeric?: number[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h} className={numeric.includes(i) ? 'num' : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td key={j} className={numeric.includes(j) ? 'num' : undefined}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
