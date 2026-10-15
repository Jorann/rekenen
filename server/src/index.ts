import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { migrate } from './db.ts';
import { api, errorHandler } from './routes.ts';

const port = Number(process.env.PORT ?? 3000);
const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));

await migrate();

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use('/api', api);
app.use('/api', errorHandler);

// In production the server also serves the built iPad app. In dev, Vite does that.
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (_req, res) => res.sendFile('index.html', { root: clientDist }));
}

app.listen(port, '0.0.0.0', () => {
  console.log(`rekenen server listening on http://localhost:${port}`);
});
