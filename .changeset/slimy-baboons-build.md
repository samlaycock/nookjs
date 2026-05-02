---
"nookjs": patch
---

Fix `getScope()` so getter-backed bindings resolve through the normal environment read path, which makes scope inspection report the current value for module imports and other live bindings.
