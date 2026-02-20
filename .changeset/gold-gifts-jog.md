---
"nookjs": patch
---

Clarify JavaScript compatibility expectations for arithmetic edge cases.

This updates package and documentation wording to explicitly call out that division/modulo by zero intentionally throws `InterpreterError` rather than using native JS `Infinity`/`NaN` results.
