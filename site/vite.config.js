import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/fogoe/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs.html'),
      },
    },
  },
  server: {
    port: 3000
  }
});
