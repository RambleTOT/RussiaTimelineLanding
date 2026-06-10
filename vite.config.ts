import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { apiPlugin } from './src/server/vitePlugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (including non-VITE_ prefixed) for server-side use only.
  // These are passed to the API middleware and never exposed to the client bundle.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), apiPlugin({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            motion: ['framer-motion'],
            gsap: ['gsap'],
          },
        },
      },
    },
  };
});
