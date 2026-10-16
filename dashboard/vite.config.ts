/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5190,
    // DASHBOARD_API_URL points the dev dashboard at another API, e.g. one using a test database.
    proxy: { '/api': process.env.DASHBOARD_API_URL ?? 'http://localhost:3001' },
  },
  test: {
    include: ['server/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
