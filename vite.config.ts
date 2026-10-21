import {defineConfig} from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    // index.html — исходник автономной версии (открывается двойным кликом),
    // в нём нет ES-модулей. Для Vite нужен отдельный вход, поэтому build:standalone
    // генерирует dev.html из index.html (./src/styles.css + ./src/main.ts).
    rollupOptions: {
      input: 'dev.html',
    },
  },
  server: {
    open: '/dev.html',
  },
  worker: {
    format: 'es',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
  },

});
