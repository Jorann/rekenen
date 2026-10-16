import { useState, type FormEvent } from 'react';
import { itemById } from '../../../shared/catalog.ts';
import type { CoinsView } from '../../server/stats.ts';
import { Avatar } from '../../../client/src/avatar/Avatar.tsx';
import { sanitizeLook } from '../../../client/src/avatar/look.ts';
import { Pet } from '../../../client/src/avatar/pets.tsx';
import { ItemThumb } from '../../../client/src/shop/ItemThumb.tsx';
import { api } from '../api.ts';
import { ChartCard, DataTable } from '../charts/ChartCard.tsx';
import { LineChart } from '../charts/Line.tsx';
import { ACCENT } from '../colors.ts';
import { dayLabel, dayShortLabel, num, when } from '../format.ts';

/** Her coins: what she has, earned and bought, her character as she made it, and a form to give her coins. */
export function Coins({ coins, onGift }: { coins: CoinsView; onGift: () => void }) {
  const owned = new Set(coins.purchases.map((p) => p.itemId));
  const look = sanitizeLook(coins.avatar, owned);
  const goal = coins.goal ? itemById(coins.goal) : undefined;
  const series = coins.balanceSeries;

  return (
    <>
      <section className="card coins-card wide">
        <div className="portrait" aria-label={`Zo ziet ${coins.player} eruit in de app`}>
          <Avatar look={look} />
          {look.worn.pet && <Pet id={look.worn.pet} className="portrait-pet" />}
        </div>
        <div className="coins-info">
          <h2 className="card-title">Muntjes</h2>
          <p className="card-sub">Eén muntje per goede som. Ze besteedt ze aan kleren, dieren en haar eigen plekje.</p>
          <div className="mini-stats">
            <Mini label="Nu" value={num(coins.balance)} />
            <Mini label="Verdiend" value={num(coins.earned)} />
            <Mini label="Gekregen" value={num(coins.gifted)} />
            <Mini label="Uitgegeven" value={num(coins.spent)} />
          </div>
          {goal && (
            <div className="wish">
              <div className="wish-thumb">
                <ItemThumb id={goal.id} look={look} />
              </div>
              <div className="wish-text">
                <span>
                  Haar wens: <strong>{goal.name}</strong> ({num(goal.price)} muntjes)
                </span>
                <div className="meter" role="meter" aria-valuenow={coins.balance} aria-valuemin={0} aria-valuemax={goal.price}>
                  <div style={{ width: `${Math.min(100, (coins.balance / goal.price) * 100)}%` }} />
                </div>
                <span className="muted">{coins.balance >= goal.price ? 'Ze heeft genoeg!' : `Nog ${num(goal.price - coins.balance)} te gaan`}</span>
              </div>
            </div>
          )}
          <GiftForm player={coins.player} onDone={onGift} />
        </div>
      </section>

      <ChartCard
        title="Muntjes in de loop van de tijd"
        subtitle="Wat ze aan het eind van elke dag had"
        table={<DataTable head={['Dag', 'Muntjes']} numeric={[1]} rows={series.map((p) => [dayLabel(p.day), num(p.balance)])} />}
      >
        <LineChart
          data={series.map((p) => ({ key: p.day, value: p.balance }))}
          color={ACCENT}
          format={num}
          xLabel={dayShortLabel}
          tipTitle={dayLabel}
          tipRows={(i) => [{ value: num(series[i].balance), label: 'muntjes' }]}
        />
      </ChartCard>

      <section className="card">
        <header className="card-head">
          <div>
            <h2 className="card-title">Gekocht</h2>
            <p className="card-sub">Nieuwste eerst</p>
          </div>
        </header>
        {coins.purchases.length ? (
          <ul className="purchases">
            {coins.purchases.map((p) => (
              <li key={p.id}>
                <span className="purchase-thumb">
                  <ItemThumb id={p.itemId} look={look} />
                </span>
                <span className="purchase-name">{p.name}</span>
                <span className="muted">{when(p.purchasedAt)}</span>
                <span className="num">{num(p.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Nog niets gekocht.</p>
        )}
        {coins.gifts.length > 0 && (
          <>
            <h3 className="round-title">Gekregen en afgepakt</h3>
            <DataTable
              head={['Wanneer', 'Waarom', 'Muntjes']}
              numeric={[2]}
              rows={coins.gifts.map((g) => [when(g.createdAt), g.note ?? <span className="muted">geen reden</span>, g.amount > 0 ? `+${num(g.amount)}` : num(g.amount)])}
            />
          </>
        )}
      </section>
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini">
      <span className="stat-label">{label}</span>
      <span className="mini-value">{value}</span>
    </div>
  );
}

/** Give coins (or take some back) with a note. She sees a gift as a surprise in the app. */
function GiftForm({ player, onDone }: { player: string; onDone: () => void }) {
  const [give, setGive] = useState(true);
  const [amount, setAmount] = useState('10');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const n = Math.floor(Number(amount));
  const valid = Number.isFinite(n) && n >= 1 && n <= 1000;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setStatus('busy');
    try {
      await api.gift(player, give ? n : -n, note.trim());
      setStatus('done');
      setNote('');
      onDone();
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="gift-form" onSubmit={submit}>
      <h3 className="round-title">Muntjes geven</h3>
      <div className="gift-row">
        <div className="segmented" role="group" aria-label="Geven of afpakken">
          <button type="button" aria-pressed={give} onClick={() => setGive(true)}>
            Geven
          </button>
          <button type="button" aria-pressed={!give} onClick={() => setGive(false)}>
            Afpakken
          </button>
        </div>
        <label className="field small">
          <span>Aantal</span>
          <input type="number" min={1} max={1000} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="field">
          <span>Waarom {give ? '(ziet ze in de app)' : ''}</span>
          <input type="text" maxLength={120} value={note} placeholder={give ? 'Voor het opruimen van je kamer' : ''} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className="primary-btn" disabled={!valid || status === 'busy'}>
          {give ? `Geef ${valid ? num(n) : ''} muntjes` : `Pak ${valid ? num(n) : ''} muntjes af`}
        </button>
      </div>
      {status === 'done' && <p className="form-note good">Gelukt. {give ? `${player} krijgt een cadeautje te zien in de app.` : ''}</p>}
      {status === 'error' && <p className="form-note">Dat lukte niet. Probeer het nog eens.</p>}
    </form>
  );
}
