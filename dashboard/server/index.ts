import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { fromDashboard, passwordRequired } from './auth.ts';
import { pool } from './db.ts';
import { api, errorHandler } from './routes.ts';

// Not PORT: in development the dashboard shares the repository's .env with the app server.
const port = Number(process.env.DASHBOARD_PORT ?? 3001);
const password = process.env.DASHBOARD_PASSWORD ?? '';
const webDist = fileURLToPath(new URL('../dist/', import.meta.url));

if (!password) {
  if (process.env.NODE_ENV === 'production') {
    console.error('DASHBOARD_PASSWORD is not set. Set it in .env; the dashboard shows Nomi\'s results and can give coins.');
    process.exit(1);
  }
  console.warn('DASHBOARD_PASSWORD is not set: no password needed (development only).');
}

const app = express();

// Unprotected, for the container health check only.
app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

if (password) app.use(passwordRequired(password));
app.use(fromDashboard);
app.use(express.json({ limit: '10kb' }));
app.use('/api', api);
app.use('/api', errorHandler);

// In production the server also serves the built dashboard. In dev, Vite does that.
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('/{*splat}', (_req, res) => res.sendFile('index.html', { root: webDist }));
}

app.listen(port, '0.0.0.0', () => {
  console.log(`rekenen dashboard listening on http://localhost:${port}`);
});
