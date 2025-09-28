# @managerx/core-sim

Deterministic simulator (seeded) for ManagerX.

## API

- `createPrng(seed)` -> PRNG with `next()` and `int(min, max)`
- `simulateMatch(seed, homeAdvantage?)` -> `{ homeGoals, awayGoals }`
