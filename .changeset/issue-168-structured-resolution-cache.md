---
"nookjs": patch
---

Replace the module resolution context fast-path cache with a structured key cache so repeated authorized imports avoid JSON stringification overhead while preserving existing cache semantics and bounded growth.
