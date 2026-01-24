# FunctionExpressions

## What it is

Defines a function as an expression: `const f = function() { ... }`.

## Interpreter implementation

- Parsed as `FunctionExpression` and handled in `evaluateFunctionExpression`.
- Produces a `FunctionValue` with a captured closure.

## Gotchas

- No parameter destructuring.
- Function expression name binding is not treated as a separate inner scope.
