---
"nookjs": patch
---

Implement function declaration hoisting so declarations are pre-bound before statement execution in program and block scopes.

- Add a scope-level declaration pass that hoists `FunctionDeclaration` nodes before executing statements.
- Skip re-evaluating hoisted function declaration statements during normal execution.
- Add regression tests for calling functions before declaration at top-level, in nested function scope, and inside block scope.
- Update documentation to remove the previous no-hoisting limitation and describe scope-local hoisting behavior.
