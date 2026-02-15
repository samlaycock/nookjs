---
'nookjs': patch
---

Fix concurrent cross-request data leak by serializing evaluateAsync calls

Adds an evaluation mutex to serialize concurrent `evaluateAsync()` and `evaluateModuleAsync()` calls, ensuring proper isolation of per-call globals between concurrent requests. This fixes a security vulnerability where globals could leak between different async evaluations.
