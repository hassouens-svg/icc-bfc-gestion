import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, les appels à /api sont redirigés vers le backend FastAPI.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.VITE_BACKEND_URL || 'http://localhost:8000' },
  },
});
