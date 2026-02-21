import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ssr: {
    noExternal: ['@lucide/svelte', '@humanspeak/svelte-motion'],
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
    environment: 'jsdom',
    alias: {
      $lib: '/src/lib',
    },
  },
});
