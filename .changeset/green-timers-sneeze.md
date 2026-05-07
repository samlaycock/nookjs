---
"nookjs": patch
---

Fix `Object.create()` so sandbox-created prototype objects produce mutable sandbox-owned results instead of read-only host proxies.
