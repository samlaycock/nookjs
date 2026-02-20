---
"nookjs": patch
---

Add opt-in strict evaluation isolation to serialize mixed sync/async access safely.

When `strictEvaluationIsolation: true` is set on `Interpreter` (or `createSandbox`), synchronous `evaluate()` / `runSync()` calls are blocked while async/module evaluations are pending, preventing shared-state races between sync and async runs on the same instance.
