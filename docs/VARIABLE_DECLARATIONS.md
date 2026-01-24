# VariableDeclarations

## What it is

Declares variables using `var`, `let`, or `const`.

## Interpreter implementation

- Parsed as `VariableDeclaration` and handled in `evaluateVariableDeclaration`.
- Scoping is implemented by `Environment`.
- `var` declarations are function-scoped via `findVarScope`.

## Gotchas

- `var` is not hoisted to `undefined`; it is created when evaluated.
- `const` requires an initializer and cannot be reassigned.
- Destructuring requires `Destructuring` to be enabled.
