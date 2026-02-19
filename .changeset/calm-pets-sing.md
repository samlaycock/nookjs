---
"nookjs": patch
---

Fix module failure caching state so failed modules are tracked as `failed` instead of remaining `initializing`.

Failed module parse/evaluation now updates metadata with the stored error and reuses the failed cache record on subsequent imports, avoiding repeated re-evaluation attempts.
