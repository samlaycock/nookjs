---
"nookjs": patch
---

Keep detached dynamic imports inside the evaluation that started them. `evaluateAsync()` and `evaluateModuleAsync()` now wait for every `import()` they started to settle before ending, so an unawaited import can no longer run module code after its evaluation has finished, under a later evaluation's per-call globals, limits or abort signal, or count towards another run's execution statistics.
