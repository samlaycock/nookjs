# YieldExpression

## What it is

`yield` and `yield*` expressions inside generator bodies.

## Interpreter implementation

- Implemented in `evaluateYieldExpression` / `evaluateYieldExpressionAsync`.
- Produces a `YieldValue` that the generator executor interprets as a pause.
- `yield*` delegates to arrays, generators, or objects with `Symbol.iterator`.

## Gotchas

- Only valid within generator execution contexts.
- Requires `Generators` or `AsyncGenerators` to be enabled.
- Delegation requires an iterable; non-iterables throw.
