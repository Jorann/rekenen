import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set (see .env.example)');
}

/**
 * The app's database, read-only by default: the dashboard only looks. The one thing it changes
 * (giving coins) opens a READ WRITE transaction for it. The app server owns the schema and its migrations.
 */
export const pool = new pg.Pool({ connectionString: databaseUrl, options: '-c default_transaction_read_only=on', max: 5 });
