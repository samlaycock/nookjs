---
"nookjs": patch
---

Honor `timeoutMs`/abort cancellation while async `run()` and `runModule()` calls are waiting in the
evaluation mutex queue, so queued evaluations abort on wall-clock timeout instead of only after they
eventually acquire the lock.
