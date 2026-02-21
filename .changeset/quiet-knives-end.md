---
"nookjs": patch
---

Fix arrow functions to use lexical `this` and lexical `arguments` from the enclosing scope.

- Capture arrow `this` at creation time and ignore call-site receiver binding.
- Bind `arguments` for non-arrow functions so nested arrows resolve enclosing call arguments.
- Add regression tests for method-context arrows, nested lexical arguments, and async arrows.
- Update docs to remove the previous arrow lexical `this`/`arguments` limitation.
