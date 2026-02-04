# FunctionDeclarations

## What it is

Defines a named function using `function foo() { ... }`.

## Interpreter implementation

- Parsed as `FunctionDeclaration` and handled in `evaluateFunctionDeclaration`.
- Creates a `FunctionValue` that captures the current environment.
- Parameters support identifiers, destructuring, rest, and default values.

## Gotchas

- Function declarations execute in order (no full hoisting semantics).
