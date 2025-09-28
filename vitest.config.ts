import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Per-package thresholds
        'packages/core-sim/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'packages/content/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      include: [
        'packages/*/src/**/*.ts',
        'packages/*/src/**/*.tsx',
      ],
      exclude: [
        'packages/*/src/**/*.d.ts',
        'packages/*/src/**/*.stories.tsx',
        'packages/*/src/**/index.ts',
        'packages/*/tests/**',
        'packages/*/dist/**',
      ],
    },
    include: ["**/src/**/*.{test,spec}.ts", "**/tests/**/*.{test,spec}.ts", "**/*.{test,spec}.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
    ],
    /* Retry flaky tests */
    retry: process.env.CI ? 3 : 1,
    /* Test timeout */
    testTimeout: 10000,
    /* Hook timeout */
    hookTimeout: 10000,
  },
});

