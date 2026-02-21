---
"nookjs": patch
---

Fix `var` hoisting semantics so `var` bindings are created as `undefined` at function/global scope setup time instead of only when declaration statements execute.

- Hoist `var` bindings before executing program and function bodies, including declarations nested inside blocks and loops.
- Preserve assignment semantics so `var x;` does not overwrite an already-hoisted value at declaration execution time.
- Add regressions for pre-declaration read/write behavior and nested-function scope shadowing.
- Update docs to remove the outdated limitation that said `var` is not hoisted.
