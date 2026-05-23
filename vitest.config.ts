import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/features/**/*.ts', 'src/services/**/*.ts', 'src/shared/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: {
        lines: 13,
        statements: 13,
        functions: 55,
        branches: 70
      }
    }
  }
})
