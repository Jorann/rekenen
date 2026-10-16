# Regenboog Rekenen 🌈🦄

A colourful maths practice app for the iPad: addition and subtraction up to 100 (never negative) and the times tables 1–10. Every session, every sum and every attempt is saved to Postgres, including how long each sum took.

## Run it at home

```sh
docker compose up -d --build
```

Then on the iPad (same Wi-Fi), open Safari at `http://<this-computer's-ip>:3000`. Find the IP with `ipconfig getifaddr en0`.
Tap Share → **Add to Home Screen** to open it full-screen like an app.

Stop it with `docker compose down`. The data is kept in the `pgdata` volume. `docker compose down -v` deletes it.

## How it works

- **Home screen:** her own character, her coins and what she is saving for, with three buttons: *Rekenen*, *Aankleden* and *Mijn plekje*.
- **Settings (Rekenen):** choose +, − and/or × (mixing is allowed), the number range for + and − (20/50/100), which times tables, sums per round and the number of rounds. Settings are remembered on the iPad.
- **Player:** always Nomi for now. Set `ASK_NAME = true` in `client/src/config.ts` to ask for a name first; sessions, coins and purchases are stored per name.
- **Playing:** big on-screen number pad. A wrong answer shakes red immediately and she tries again, with unlimited retries. A right answer sparkles and moves on.
- **Rewards:** a short celebration after each round (three variants take turns: rainbow ride, balloons, spinning star) and a big finale after the last round.
- **Timing:** measured on the iPad, so a slow network doesn't count. The clock pauses while the iPad is locked or the app is in the background.
- **No lost data:** results go into a queue on the iPad and are sent in order. If the server is unreachable they are retried until they arrive. All writes are idempotent.

## Coins and the shop

- **Coins:** one for every solved sum, also after a wrong try. Sums she did before the shop existed count too. A coin flies into her purse after every right answer; the end of each round and of the game shows what she earned.
- **Aankleden:** free choices (skin, eyes, freckles, 8 hairstyles, 5 natural hair colours) and a shop with clothes, dresses, shoes, hats, glasses, things for her back and her hand, special hair colours and pets. She can try anything on before buying, and pick the colour of most clothes. Buying always asks "Kopen voor … ?" first.
- **Mijn plekje:** first a piece of land (200), then a tent, wooden house, cottage or castle (100 to 1500), and a garden: flowers, trees, a swing, a pond, a trampoline and more. She drags things around; tapping a tulip, the mailbox, the dog house or the slide changes its colour.
- **Wish:** for something she can't afford yet she can tap *Dit wil ik!*; the home screen and the end of a game show how far she is.
- **Prices** are in [`shared/catalog.ts`](shared/catalog.ts), which the server also uses to check every purchase. Changing a price doesn't change what she already paid. At about 5 seconds per sum a 15-minute session earns well over 100 coins; the whole shop is roughly 9,000.
- **Where it's kept:** the server is the source of truth (Safari may clear an iPad web app's storage after a week without use). Buying also works without Wi-Fi: the iPad counts it straight away and sends it when the server is back, and the server checks the balance again.

## Release and deploy

Pushing a version tag builds the image (amd64 and arm64) and publishes it to `ghcr.io/jorann/rekenen`. Ordinary pushes build nothing.

```sh
git tag v1.0.0 && git push origin v1.0.0   # publishes 1.0.0, 1.0, 1 and latest
```

On the server you only need two files in a folder: [`docker-compose.prod.yml`](docker-compose.prod.yml) and a `.env` based on [`.env.prod.example`](.env.prod.example).

```sh
curl -fsSLO https://raw.githubusercontent.com/Jorann/rekenen/master/docker-compose.prod.yml
curl -fsSL https://raw.githubusercontent.com/Jorann/rekenen/master/.env.prod.example -o .env
# set POSTGRES_PASSWORD in .env (openssl rand -hex 24)
docker compose -f docker-compose.prod.yml up -d
```

To update after a new release: `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`.

The database is only reachable inside the compose network. To make a backup:

```sh
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U rekenen rekenen > rekenen-$(date +%F).sql
```

## Development

```sh
npm install
npm run db:up        # Postgres in Docker on localhost:5433
cp .env.example .env # once
npm run dev          # API on :3000 and Vite on :5180, reachable from the iPad too
npm test             # question generator tests
npm run typecheck
```

The server runs TypeScript directly with Node 24 (type stripping, no build step). It applies `server/migrations/*.sql` on startup. Code used by both the iPad app and the server (the shop's catalog) lives in `shared/`.

To try things without touching real data, run a second API server on a test database and point Vite at it:

```sh
docker compose exec db psql -U rekenen -c 'CREATE DATABASE rekenen_test'   # once
DATABASE_URL=postgres://rekenen:rekenen@localhost:5433/rekenen_test PORT=3100 npm run dev -w server
API_URL=http://localhost:3100 npm run dev -w client
```

In development, `http://localhost:5180/#gallery` shows every drawing (character, clothes, pets, houses, garden) side by side; add `?slot=hat` (or `top`, `pet`, `home`, ...) to see one kind.

## Data

| table | one row per |
|---|---|
| `players` | child (by name) |
| `sessions` | practice session with its settings. `finished_at` is NULL if she stopped early |
| `questions` | solved sum: operands, answer, `duration_ms` (shown → correct), `wrong_attempts` |
| `attempts` | every answer she submitted, wrong ones included, with `elapsed_ms` |
| `purchases` | item bought in the shop, with the price paid |
| `coin_gifts` | coins a parent gave (or took back, with a negative amount) |
| `player_state` | her character (`avatar`), her garden (`home`) and her wish (`goal`), as JSON |

Her balance is `solved sums + coin_gifts - purchases`; `GET /api/players/Nomi/profile` shows it.

Read endpoints for the future dashboard: `GET /api/sessions` (summaries) and `GET /api/sessions/:id` (sums and attempts).

Some useful queries (`docker compose exec db psql -U rekenen`):

```sql
-- Slowest times-table sums
SELECT operand_a || ' × ' || operand_b AS sum, round(avg(duration_ms) / 1000.0, 1) AS avg_seconds, count(*)
FROM questions WHERE operation = 'mul' GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- Give her coins, e.g. for helping at home. She gets a "cadeautje" message with the note.
INSERT INTO coin_gifts (player_id, amount, note) SELECT id, 25, 'Voor het opruimen van je kamer' FROM players WHERE name = 'Nomi';

-- Undo a purchase she regrets: she gets the coins back and the item disappears.
SELECT id, item_id, price, purchased_at FROM purchases ORDER BY purchased_at DESC LIMIT 10;
DELETE FROM purchases WHERE id = '<id from above>';

-- Most common wrong answers
SELECT q.operand_a, q.operation, q.operand_b, a.answer AS wrong_answer, count(*)
FROM attempts a JOIN questions q ON q.id = a.question_id
WHERE NOT a.is_correct GROUP BY 1, 2, 3, 4 ORDER BY 5 DESC LIMIT 10;
```
