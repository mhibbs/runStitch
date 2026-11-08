import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/runStitch/',
  plugins: [svelte()],
  server: {
    port: 5173,
    host: true
  }
});
