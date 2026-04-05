---
"nookjs": patch
---

Forward custom module resolver `authorize()` hooks through `createSandbox()` so sandbox module execution applies importer-aware access checks consistently with the lower-level interpreter API.
