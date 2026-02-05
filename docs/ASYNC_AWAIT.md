# AsyncAwait

## What it is

`async` functions and `await` expressions.

## Interpreter implementation

- Async functions are executed via `evaluateAsync`.
- `await` is evaluated in `evaluateAwaitExpressionAsync`.
- Host async functions must be provided as async and are awaited.

## Gotchas

- Top-level `await` is only supported in module evaluation (`runModule` / `evaluateModuleAsync`).
- In non-module evaluation, `await` is only valid inside async functions.
- Calling async host functions in sync mode throws.
