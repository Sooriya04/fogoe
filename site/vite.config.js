import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/fogoe/',
  build: {
    outDir: resolve(__dirname, '../docs'),
    emptyOutDir: true,
  },
  server: {
    port: 3000
  }
});
