---
"nookjs": patch
---

Reuse cached module-path lookups for repeated imports from the same resolution context even when a module resolver does not implement `authorize()`. This removes redundant `resolve()` calls while preserving the existing per-import re-authorization behavior when `authorize()` is present.
