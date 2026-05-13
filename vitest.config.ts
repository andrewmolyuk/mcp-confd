import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['node_modules', 'dist', 'example', 'scripts'],
    coverage: {
      reporter: ['lcovonly', 'text'],
      include: ['src/**/*.ts'],
      exclude: ['**/types.ts'],
      all: true,
    },
  },
})