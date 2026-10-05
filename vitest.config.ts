import { defineConfig } from 'vitest/config'

// Every test lives under test/ and needs neither Docker nor the network (SCOPE.md section 5); the labs
// themselves run through `pnpm lab:a`, `pnpm lab:b` and `pnpm lab:c`.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // A test that starts a process outlived Vitest's 5-second default on a loaded Windows machine in
    // the previous run of this portfolio (SCOPE.md, "Language and style").
    testTimeout: 30_000,
  },
})
