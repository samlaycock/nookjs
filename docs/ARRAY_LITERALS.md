# ArrayLiterals

## What it is

Creates arrays with literal syntax like `[1, 2, 3]`.

## Interpreter implementation

- Parsed as `ArrayExpression` and handled in `evaluateArrayExpression` / `evaluateArrayExpressionAsync`.
- Supports holes (missing elements) and spread.
- Array spread uses `validateArraySpread`, which accepts arrays, generators, and iterables.

## Gotchas

- Only a limited set of array methods is exposed via `getArrayMethod`.
- Access uses explicit bounds checks (negative indexes return `undefined`).
