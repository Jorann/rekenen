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

- **Start screen:** choose +, − and/or × (mixing is allowed), the number range for + and − (20/50/100), which times tables, sums per round and the number of rounds. Settings are remembered on the iPad.
- **Player:** always Nomi for now. Set `ASK_NAME = true` in `client/src/config.ts` to bring back the name field; sessions are stored per name.
- **Playing:** big on-screen number pad. A wrong answer shakes red immediately and she tries again, with unlimited retries. A right answer sparkles and moves on.
- **Rewards:** a short celebration after each round (three variants take turns: rainbow ride, balloons, spinning star) and a big finale after the last round.
- **Timing:** measured on the iPad, so a slow network doesn't count. The clock pauses while the iPad is locked or the app is in the background.
- **No lost data:** results go into a queue on the iPad and are sent in order. If the server is unreachable they are retried until they arrive. All writes are idempotent.

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

The server runs TypeScript directly with Node 24 (type stripping, no build step). It applies `server/migrations/*.sql` on startup.

## Data

| table | one row per |
|---|---|
| `players` | child (by name) |
| `sessions` | practice session with its settings. `finished_at` is NULL if she stopped early |
| `questions` | solved sum: operands, answer, `duration_ms` (shown → correct), `wrong_attempts` |
| `attempts` | every answer she submitted, wrong ones included, with `elapsed_ms` |

Read endpoints for the future dashboard: `GET /api/sessions` (summaries) and `GET /api/sessions/:id` (sums and attempts).

Some useful queries (`docker compose exec db psql -U rekenen`):

```sql
-- Slowest times-table sums
SELECT operand_a || ' × ' || operand_b AS sum, round(avg(duration_ms) / 1000.0, 1) AS avg_seconds, count(*)
FROM questions WHERE operation = 'mul' GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- Most common wrong answers
SELECT q.operand_a, q.operation, q.operand_b, a.answer AS wrong_answer, count(*)
FROM attempts a JOIN questions q ON q.id = a.question_id
WHERE NOT a.is_correct GROUP BY 1, 2, 3, 4 ORDER BY 5 DESC LIMIT 10;
```
