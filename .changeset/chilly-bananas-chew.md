---
"nookjs": patch
---

Fix circular ES module handling so in-progress modules are reused instead of recursively re-evaluated.

This prevents true import cycles (for example `a -> b -> a`) from recursing until module max depth is exceeded.
