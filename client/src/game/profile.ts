import { useSyncExternalStore } from 'react';
import { decidePurchase, type PurchaseDecision, type StateKey } from '../../../shared/catalog.ts';
import { applyJob, balanceOf, EMPTY_PROFILE, type Profile, type ServerProfile } from './ledger.ts';
import { isSending, pendingJobs, post, sendCount, subscribe as onOutbox } from './outbox.ts';
import { load, save } from './storage.ts';
import { uuid } from './uuid.ts';

function playerUrl(player: string): string {
  return `/api/players/${encodeURIComponent(player)}`;
}

/**
 * Her coins, what she bought and how her character and garden look.
 *
 * The server is the source of truth: Safari may clear an iPad web app's storage after a week without use,
 * and the coins must survive that. The iPad keeps the last answer from the server, plus everything
 * still waiting in the outbox on top of it. So a coin or a purchase shows up the moment it happens,
 * also without Wi-Fi.
 */
class ProfileStore {
  private base: ServerProfile;
  private synced: boolean;
  private view: Profile;
  private listeners = new Set<() => void>();
  private refreshing = false;
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly cacheKey: string;
  private readonly player: string;

  constructor(player: string) {
    this.player = player;
    this.cacheKey = `rekenen.profile.${player}`;
    const cached = load<{ profile: ServerProfile; synced: boolean } | null>(this.cacheKey, null);
    this.base = cached ? { ...EMPTY_PROFILE, ...cached.profile } : EMPTY_PROFILE;
    this.synced = cached?.synced ?? false;
    this.view = this.compute();

    onOutbox((event) => {
      if (event.type === 'idle') {
        this.scheduleRefresh(300);
        return;
      }
      if (event.job.meta?.player !== this.player) return;
      if (event.type === 'sent') {
        this.base = applyJob(this.base, event.job, true);
        this.persist();
      }
      this.update();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.scheduleRefresh(500);
    });
    void this.refresh();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): Profile => this.view;

  /** Fetches the latest from the server. Quietly keeps what it has when the server can't be reached. */
  async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      for (let tries = 0; tries < 3; tries++) {
        // While a job is on its way we can't tell whether the server's answer includes it. The outbox
        // says when it's done ('idle'), and that triggers another refresh.
        if (isSending()) return;
        const before = sendCount();
        const res = await fetch(`${playerUrl(this.player)}/profile`);
        if (!res.ok) return;
        const data = (await res.json()) as ServerProfile;
        if (sendCount() !== before || isSending()) continue;
        this.base = { ...EMPTY_PROFILE, ...data };
        this.synced = true;
        this.persist();
        this.update();
        return;
      }
    } catch {
      // Offline. The cached profile plus the outbox is still right.
    } finally {
      this.refreshing = false;
    }
  }

  scheduleRefresh(delayMs: number): void {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => void this.refresh(), delayMs);
  }

  buy(itemId: string): PurchaseDecision {
    const decision = decidePurchase(itemId, this.view.owned, this.view.balance);
    if (decision === 'ok') {
      post(
        `${playerUrl(this.player)}/purchases`,
        { id: uuid(), itemId, purchasedAt: new Date().toISOString() },
        { kind: 'purchase', player: this.player },
      );
    }
    return decision;
  }

  setState(key: StateKey, value: unknown): void {
    // Always later than the last change, even if the iPad's clock jumped back.
    const last = this.view.state[key]?.updatedAt;
    let updatedAt = new Date().toISOString();
    if (last && updatedAt <= last) updatedAt = new Date(Date.parse(last) + 1).toISOString();
    post(`${playerUrl(this.player)}/state`, { key, value, updatedAt }, { kind: 'state', player: this.player, key });
  }

  private compute(): Profile {
    let p = this.base;
    for (const job of pendingJobs()) {
      if (job.meta?.player === this.player) p = applyJob(p, job);
    }
    return { ...p, balance: balanceOf(p), owned: new Set(p.purchases.map((x) => x.itemId)), synced: this.synced };
  }

  private update(): void {
    this.view = this.compute();
    for (const listener of this.listeners) listener();
  }

  private persist(): void {
    save(this.cacheKey, { profile: this.base, synced: this.synced });
  }
}

const stores = new Map<string, ProfileStore>();

export function profileStore(player: string): ProfileStore {
  let store = stores.get(player);
  if (!store) {
    store = new ProfileStore(player);
    stores.set(player, store);
  }
  return store;
}

export function useProfile(player: string): Profile {
  const store = profileStore(player);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
