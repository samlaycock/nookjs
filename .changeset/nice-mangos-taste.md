---
"nookjs": patch
---

Add explicit module-system regression coverage for circular imports and missing named re-exports.

This adds tests for a direct `a -> b -> a` circular chain and for aliased missing re-exports (`export { missing as renamed } from ...`) to guard against regressions in ESM resolution and export validation.
