# LogicalAssignment

## What it is

Logical assignment operators: `||=`, `&&=`, and `??=`.

## Interpreter implementation

- Implemented in `evaluateLogicalAssignment` / `evaluateLogicalAssignmentAsync`.
- Uses short-circuit semantics: the right-hand side is only evaluated when needed.

## Gotchas

- Uses interpreter truthiness semantics for `||=` and `&&=`.
- Assignment targets are subject to the same property and security checks as `=`.
