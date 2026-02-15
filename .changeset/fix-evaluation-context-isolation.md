---
"nookjs": patch
---

Fix EvaluationContext stack for run isolation - fix security vulnerability where concurrent async runs shared per-call policy state, allowing policy bypass. Added EvaluationContext class with stack-based management to isolate validators, feature controls, abort signals, and resource limits between overlapping runs.
