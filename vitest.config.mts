import path from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.ts'],
    env: loadEnv(mode, process.cwd(), ['NEXT_PUBLIC_SUPABASE', 'SUPABASE_']),
  },
}));
