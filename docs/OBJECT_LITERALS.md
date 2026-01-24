# ObjectLiterals

## What it is

Creates objects with literal syntax like `{ key: value }`.

## Interpreter implementation

- Parsed as `ObjectExpression` and handled in `evaluateObjectExpression` / `evaluateObjectExpressionAsync`.
- Keys are restricted to `Identifier` or `Literal` via `extractPropertyKey`.
- Property names are validated with `validatePropertyName`.
- Object spread uses `validateObjectSpread` when `SpreadOperator` is enabled.

## Gotchas

- No computed keys, getters/setters, or method shorthand.
- Dangerous keys like `__proto__`, `constructor`, `prototype` are blocked.
- Symbol keys are not supported (computed keys are not supported).
- Object spread only accepts non-null, non-array objects.
- Object spread copies own enumerable string keys only.
