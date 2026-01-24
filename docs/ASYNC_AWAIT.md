# AsyncAwait

## What it is

`async` functions and `await` expressions.

## Interpreter implementation

- Async functions are executed via `evaluateAsync`.
- `await` is evaluated in `evaluateAwaitExpressionAsync`.
- Host async functions must be provided as async and are awaited.

## Gotchas

- No top-level `await` in sync evaluation.
- Calling async host functions in sync mode throws.
