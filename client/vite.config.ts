/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // reachable from the iPad on the same Wi-Fi
    port: 5180,
    // API_URL points the dev app at another API server, e.g. one using a test database.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3000' },
  },
});
