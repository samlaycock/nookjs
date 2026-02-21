# FunctionDeclarations

## What it is

Defines a named function using `function foo() { ... }`.

## Interpreter implementation

- Parsed as `FunctionDeclaration` and handled in `evaluateFunctionDeclaration`.
- Creates a `FunctionValue` that captures the current environment.
- Parameters support identifiers, destructuring, rest, and default values.

## Gotchas

- Function declarations are hoisted to the top of their current scope before statement execution.
- Hoisting is scope-local: declarations inside a block are available throughout that block, but not outside it.
