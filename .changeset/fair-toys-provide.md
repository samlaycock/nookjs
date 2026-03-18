---
"nookjs": patch
---

Reject illegal top-level `return`, `break`, and `continue` statements with native-style `InterpreterError`s instead of leaking internal control-flow markers.
