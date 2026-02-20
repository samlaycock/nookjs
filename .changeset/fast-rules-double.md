---
"nookjs": patch
---

Remove unused `parseScript` and `parseModule` options parameters in the AST parser API.

These options were accepted but ignored. The signatures now match runtime behavior, and related interpreter call sites were updated to call the parser helpers without no-op options.
