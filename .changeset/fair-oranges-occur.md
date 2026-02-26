---
"nookjs": patch
---

Implement live ESM bindings for named imports and re-exports instead of snapshotting export values at evaluation time.

- Make imported bindings getter-backed so reads reflect exporter updates.
- Keep re-exported bindings (`export { ... } from` and `export *`) live.
- Reuse the in-progress module exports object during evaluation to improve circular import behavior.
- Add module tests covering mutable exports, re-exports, and circular live-binding scenarios.
- Update module docs to remove the stale "No live bindings" limitation.
