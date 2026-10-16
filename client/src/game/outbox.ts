import { load, save } from './storage.ts';

/**
 * Results go into a queue kept in localStorage and are sent to the server in order.
 * The game never waits on the network, and nothing is lost when the Wi-Fi drops or the server is off;
 * the queue is retried until the server has everything. Every endpoint is idempotent, so resending is safe.
 */
export interface Job {
  url: string;
  body: unknown;
  /** What the job means for the coins and the shop, so the profile can count it before the server has it. */
  meta?: JobMeta;
}

export type JobMeta =
  | { kind: 'coin'; player: string }
  | { kind: 'purchase'; player: string }
  | { kind: 'state'; player: string; key: string };

export type OutboxEvent = { type: 'queued' | 'sent' | 'dropped'; job: Job } | { type: 'idle' };

const KEY = 'rekenen.outbox';
let queue: Job[] = load<Job[]>(KEY, []);
let flushing = false;
let inFlight: Job | null = null;
let sends = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 2000;
const listeners = new Set<(event: OutboxEvent) => void>();

export function post(url: string, body: unknown, meta?: JobMeta): void {
  const job: Job = { url, body, meta };
  if (meta?.kind === 'state') {
    // Only the newest look or garden matters: replace a change that is still waiting instead of queueing both.
    queue = queue.filter((j) => j === inFlight || !(j.meta?.kind === 'state' && j.meta.player === meta.player && j.meta.key === meta.key));
  }
  queue.push(job);
  save(KEY, queue);
  emit({ type: 'queued', job });
  void flush();
}

/** Jobs the server hasn't confirmed yet, oldest first. */
export function pendingJobs(): readonly Job[] {
  return queue;
}

/**
 * True while a request is on its way; its effect may or may not be on the server already.
 * sendCount() goes up every time a request starts. Together they tell whether a profile fetched
 * from the server can be trusted to match the queue.
 */
export function isSending(): boolean {
  return inFlight !== null;
}

export function sendCount(): number {
  return sends;
}

export function subscribe(listener: (event: OutboxEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: OutboxEvent): void {
  for (const listener of listeners) listener(event);
}

async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  clearTimeout(retryTimer);
  try {
    while (queue.length) {
      const job = queue[0];
      let res: Response;
      inFlight = job;
      sends++;
      try {
        res = await fetch(job.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(job.body),
        });
      } catch {
        inFlight = null;
        scheduleRetry();
        return;
      }
      inFlight = null;
      if (res.status >= 500 || res.status === 408 || res.status === 429) {
        scheduleRetry();
        return;
      }
      const sent = res.ok;
      if (!sent) {
        // The server rejected the data itself; retrying would block everything behind it forever.
        console.warn('outbox: dropping rejected job', job.url, res.status, await res.text().catch(() => ''));
      }
      queue = queue.filter((j) => j !== job);
      save(KEY, queue);
      retryDelay = 2000;
      emit({ type: sent ? 'sent' : 'dropped', job });
    }
    emit({ type: 'idle' });
  } finally {
    flushing = false;
  }
}

function scheduleRetry(): void {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void flush(), retryDelay);
  retryDelay = Math.min(retryDelay * 2, 60_000);
}

window.addEventListener('online', () => void flush());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void flush();
});
void flush();
