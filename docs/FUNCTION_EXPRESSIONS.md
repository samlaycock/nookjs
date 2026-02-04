# FunctionExpressions

## What it is

Defines a function as an expression: `const f = function() { ... }`.

## Interpreter implementation

- Parsed as `FunctionExpression` and handled in `evaluateFunctionExpression`.
- Produces a `FunctionValue` with a captured closure.
- Parameters support identifiers, destructuring, rest, and default values.

## Gotchas

- Function expression name binding is not treated as a separate inner scope.
