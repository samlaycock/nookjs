# ObjectLiterals

## What it is

Creates objects with literal syntax like `{ key: value }`.

## Interpreter implementation

- Parsed as `ObjectExpression` and handled in `evaluateObjectExpression` / `evaluateObjectExpressionAsync`.
- Keys can be `Identifier`, `Literal`, or computed (computed via `extractPropertyKey`).
- Property names are validated with `validatePropertyName`.
- Object spread uses `validateObjectSpread` when `SpreadOperator` is enabled.

## Gotchas

- Computed keys, getters/setters, and method shorthand are supported.
- Dangerous keys like `__proto__`, `constructor`, `prototype` are blocked.
- Symbol keys are supported.
- Object spread only accepts non-null, non-array objects.
- Object spread copies own enumerable string keys only.
