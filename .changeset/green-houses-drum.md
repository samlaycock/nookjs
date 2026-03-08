---
"nookjs": patch
---

Reject `AbortSignal` in synchronous `evaluate()` and `runSync()` calls instead of silently ignoring it.

- Throw a clear sync-only error when `signal` is provided to `Interpreter.evaluate()`.
- Reject `signal` in `createSandbox().runSync()` to match the existing async-only `timeoutMs` behavior.
- Update tests and docs to make async-only cancellation guarantees explicit.
