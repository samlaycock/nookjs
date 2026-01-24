# LetConst

## What it is

Block-scoped `let` and `const` declarations.

## Interpreter implementation

- Implemented in `evaluateVariableDeclaration` with `Environment` scoping.
- `const` is enforced as immutable.

## Gotchas

- Access before declaration throws (no hoisting).
