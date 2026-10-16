import type { Operation } from '../server/stats.ts';

/** Dutch formatting for everything the dashboard shows. */

const integer = new Intl.NumberFormat('nl-NL');
const oneDecimal = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });

export const OP_SYMBOL: Record<Operation, string> = { add: '+', sub: '−', mul: '×' };
export const OP_NAME: Record<Operation, string> = { add: 'Plus', sub: 'Min', mul: 'Keer' };

export function num(n: number): string {
  return integer.format(n);
}

export function pct(share: number | null): string {
  return share == null ? '–' : `${Math.round(share * 100)}%`;
}

/** 4,2 s, or 12 s from ten seconds up. */
export function secs(ms: number | null): string {
  if (ms == null) return '–';
  const s = ms / 1000;
  return `${s < 10 ? oneDecimal.format(s) : integer.format(Math.round(s))} s`;
}

/** 45 s, 12 min, 1 u 20 min. */
export function duration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} u ${minutes % 60} min`;
}

export function sumText(op: Operation, a: number, b: number): string {
  return `${a} ${OP_SYMBOL[op]} ${b}`;
}

// Day keys ('YYYY-MM-DD') are calendar dates; format them in UTC so no time zone shifts them.
const dayShort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayLong = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekday = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', timeZone: 'UTC' });

const utc = (key: string) => new Date(`${key}T00:00:00Z`);

/** 12 okt */
export function dayShortLabel(key: string): string {
  return dayShort.format(utc(key)).replace('.', '');
}

/** ma 12 okt */
export function dayLabel(key: string): string {
  return dayLong.format(utc(key)).replace(/\./g, '');
}

export function weekdayLabel(key: string): string {
  return weekday.format(utc(key)).replace('.', '');
}

/** Week van 12 okt */
export function weekLabel(key: string): string {
  return `week van ${dayShortLabel(key)}`;
}

const clock = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' });
const localDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
const localKey = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

/** vandaag 16:20, gisteren 18:05, di 13 okt 17:40 */
export function when(iso: string): string {
  const d = new Date(iso);
  const day = localKey.format(d);
  const today = localKey.format(new Date());
  const yesterday = localKey.format(new Date(Date.now() - 86_400_000));
  const prefix = day === today ? 'vandaag' : day === yesterday ? 'gisteren' : localDate.format(d).replace(/\./g, '');
  return `${prefix} ${clock.format(d)}`;
}
