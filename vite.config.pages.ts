import path from 'node:path';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standalone static build for GitHub Pages. Kept separate from vite.config.ts
// (which targets the Cloudflare Workers/vinext deployment) because GitHub
// Pages only serves static files and cannot run the RSC/Workers server.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'dist-pages',
    emptyOutDir: true,
  },
});
