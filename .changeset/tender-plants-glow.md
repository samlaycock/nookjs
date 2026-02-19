---
"nookjs": patch
---

Fix per-call globals cleanup when global injection fails before evaluation starts.

This makes per-call global injection transactional so failed setup no longer leaks globals between runs, and it ensures async/module evaluation mutexes are still released when setup fails early.
