---
"nookjs": patch
---

Tighten `maxCpuTime` and async abort responsiveness around heavyweight delegated operations by forcing execution-limit checks before and after host/native calls, constructors, native property reads, tagged template invocation, and iterator delegation. Add regression coverage to ensure a single host call can no longer consume CPU budget or trip an `AbortSignal` without the active evaluation failing immediately.
