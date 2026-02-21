---
"nookjs": patch
---

Add configurable numeric semantics for division/modulo by zero to improve JS compatibility without changing the default sandbox behavior.

- Introduce `numericSemantics: "safe" | "strict-js"` on both `InterpreterOptions` and `SandboxOptions`.
- Keep `"safe"` as the default, preserving existing `InterpreterError` throws for `/ 0` and `% 0`.
- Enable native JS numeric behavior in `"strict-js"` mode (`Infinity`, `-Infinity`, `NaN`).
- Add tests for strict-js division/modulo edge cases including positive/negative zero and `NaN`.
- Update README and operator/simplified API docs with migration guidance and configuration examples.
