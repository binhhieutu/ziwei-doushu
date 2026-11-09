import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15_000,
    maxWorkers: 3,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: [
        'lib/vietnam/**/*.ts',
        'lib/ai/**/*.ts',
        'lib/i18n/**/*.ts',
        'components/vietnam/**/*.{ts,tsx}',
        'components/ThemeProvider.tsx',
        'app/api/**/route.ts',
      ],
      exclude: ['**/types.ts'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
