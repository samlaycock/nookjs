---
"nookjs": patch
---

Cache `ReadOnlyProxy` object proxies and host function wrappers to preserve identity across repeated
property access and reduce allocations on hot paths.
