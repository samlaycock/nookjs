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
- In async mode, non-async sandbox callbacks passed to host code are normally wrapped as async functions so they can await host promises. Natives that consume callback return values synchronously (`String.prototype.replace`/`replaceAll`, `Array.from`, `%TypedArray%.from`, array/typed array iteration methods, `JSON.parse`/`JSON.stringify`, `Object.groupBy`/`Map.groupBy`, `Map`/`Set` `forEach`, `Reflect.apply`, iterator helpers) instead receive synchronous wrappers; see `src/native-callbacks.ts`. Interpreter-created forwarding wrappers must call `recordNativeSource` so the original native can be recognised.
- Inside such synchronous callbacks during async evaluation, calling an async host function returns its Promise without awaiting it, and calling an async sandbox function whose body and parameter defaults contain no `await` runs it synchronously and returns a settled Promise (matching native semantics). Async sandbox functions that `await` cannot be called there, because the evaluator cannot safely interleave sandbox executions; this throws a descriptive error.
