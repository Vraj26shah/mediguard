import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for MediGuard frontend.
 *
 * Proxy rules:
 *   /api  →  http://localhost:4000  (Express backend)
 *
 * This lets React components call fetch('/api/status') without
 * hardcoding the backend port — Vite forwards it automatically in dev.
 */
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@monaco-editor/react'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
