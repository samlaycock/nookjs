---
"nookjs": patch
---

Fix `as` and `satisfies` type erasure swallowing runtime code that followed the asserted type. Expressions such as `1 as number + (n = 2)` now evaluate the trailing arithmetic, comparisons, logical and conditional operators, and their side effects, matching TypeScript's own type erasure.
