import { useEffect, useRef, useState } from 'react';
import type { CoinsView, Overview, PlayerSummary, SessionDetail, SessionSummary } from '../server/stats.ts';

/** Days are counted in the time zone of whoever looks at the dashboard. */
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const query = new URLSearchParams({ tz, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`${path}?${query}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  players: () => get<PlayerSummary[]>('/api/players'),
  overview: (player: string, days: number) => get<Overview>('/api/overview', { player, days }),
  sessions: (player: string, days: number) => get<SessionSummary[]>('/api/sessions', { player, days }),
  session: (id: string) => get<SessionDetail>(`/api/sessions/${encodeURIComponent(id)}`),
  coins: (player: string, days: number) => get<CoinsView>('/api/coins', { player, days }),
  async gift(player: string, amount: number, note: string): Promise<void> {
    const res = await fetch('/api/gifts', {
      method: 'POST',
      // See fromDashboard in server/auth.ts.
      headers: { 'content-type': 'application/json', 'x-rekenen-dashboard': '1' },
      body: JSON.stringify({ player, amount, note }),
    });
    if (!res.ok) throw new Error(`gift: ${res.status}`);
  },
};

export interface Loaded<T> {
  data: T | undefined;
  error: Error | undefined;
  /** True while new data is on its way; data still holds the previous answer. */
  loading: boolean;
  reload: () => void;
}

/** Fetches whenever a key changes, and keeps showing the previous answer while the next one loads. */
export function useLoad<T>(load: () => Promise<T>, keys: unknown[]): Loaded<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const run = ++latest.current;
    setLoading(true);
    load().then(
      (d) => {
        if (run !== latest.current) return;
        setData(d);
        setError(undefined);
        setLoading(false);
      },
      (e: Error) => {
        if (run !== latest.current) return;
        setError(e);
        setLoading(false);
      },
    );
    // load is a fresh closure every render; the keys say when it really changed.
  }, [...keys, nonce]);

  return { data, error, loading, reload: () => setNonce((n) => n + 1) };
}
