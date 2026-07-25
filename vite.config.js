import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    // V9 [Medium]: Never ship source maps to the browser in production.
    // Source maps expose your original source code (component names, logic,
    // comments) to anyone who opens DevTools on the production build.
    sourcemap: false,

    // Increase the warning threshold slightly — Recharts + React Router
    // produce a chunk around 500 KB. Warn at 600 KB but don't fail the build.
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Separate large third-party libraries into their own chunk so the
        // app chunk stays cacheable independently of vendor updates.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
