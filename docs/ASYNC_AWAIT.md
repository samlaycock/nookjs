# AsyncAwait

## What it is

`async` functions and `await` expressions.

## Interpreter implementation

- Async functions are executed via `evaluateAsync`.
- `await` is evaluated in `evaluateAwaitExpressionAsync`.
- Host async functions must be provided as async and are awaited.

## Gotchas

- Top-level `await` is supported in async script evaluation (`evaluateAsync` / `run`) and module evaluation (`evaluateModuleAsync` / `runModule`).
- Synchronous `evaluate` rejects top-level `await`; use `evaluateAsync` for async snippets.
- Calling async host functions in sync mode throws.
