import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for PrivacyLens Frontend
 *
 * Development Proxy:
 * Requests starting with '/api' are proxied to the Express backend (default: http://localhost:5000).
 * This eliminates the need for cross-origin browser requests during development and allows
 * the frontend to make relative API calls such as fetch('/api/health').
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:5000';
  const port = parseInt(env.VITE_PORT, 10) || 5173;

  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
