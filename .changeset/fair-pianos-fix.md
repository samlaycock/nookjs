---
"nookjs": patch
---

Make `createSandbox()` enable strict evaluation isolation by default so reusable sandboxes serialize sync, async, and module evaluations unless callers explicitly opt out.

- Default `strictEvaluationIsolation` to `true` in the simplified sandbox API while still allowing `false` for advanced concurrency use cases.
- Add regression coverage for overlapping `runSync()` with pending `run()` and `runModule()` calls on shared sandboxes.
- Document the safe-by-default concurrency behavior and the explicit opt-out.
