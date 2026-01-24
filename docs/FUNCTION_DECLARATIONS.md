# FunctionDeclarations

## What it is

Defines a named function using `function foo() { ... }`.

## Interpreter implementation

- Parsed as `FunctionDeclaration` and handled in `evaluateFunctionDeclaration`.
- Creates a `FunctionValue` that captures the current environment.
- Parameters are identifiers plus optional rest and default values.

## Gotchas

- No parameter destructuring.
- Function declarations execute in order (no full hoisting semantics).
