import { load, save } from './storage.ts';

/**
 * Results go into a queue kept in localStorage and are sent to the server in order.
 * The game never waits on the network, and nothing is lost when the Wi-Fi drops or the server is off;
 * the queue is retried until the server has everything. Every endpoint is idempotent, so resending is safe.
 */
interface Job {
  url: string;
  body: unknown;
}

const KEY = 'rekenen.outbox';
let queue: Job[] = load<Job[]>(KEY, []);
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 2000;

export function post(url: string, body: unknown): void {
  queue.push({ url, body });
  save(KEY, queue);
  void flush();
}

async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  clearTimeout(retryTimer);
  try {
    while (queue.length) {
      const job = queue[0];
      let res: Response;
      try {
        res = await fetch(job.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(job.body),
        });
      } catch {
        scheduleRetry();
        return;
      }
      if (res.status >= 500 || res.status === 408 || res.status === 429) {
        scheduleRetry();
        return;
      }
      if (!res.ok) {
        // The server rejected the data itself; retrying would block everything behind it forever.
        console.warn('outbox: dropping rejected job', job.url, res.status, await res.text().catch(() => ''));
      }
      queue.shift();
      save(KEY, queue);
      retryDelay = 2000;
    }
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
