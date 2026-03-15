---
"nookjs": patch
---

Make the fuzzing suite deterministic and replayable with explicit seeds.

- Replace direct `Math.random()` usage in the fuzz tests with a seeded PRNG.
- Derive a stable case seed for each fuzz test from a shared `NOOK_FUZZ_SEED` base value.
- Include the base seed in fuzz test names and failure messages so CI failures can be replayed locally.
