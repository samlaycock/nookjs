# AsyncGenerators

## What it is

Async generator functions (`async function*`) that produce async iterators via `yield`.

## Interpreter implementation

- Async generator functions are `FunctionValue` with `isAsync = true` and `isGenerator = true`.
- Calling an async generator returns an `AsyncGeneratorValue` from `evaluateCallExpressionAsync`.
- `AsyncGeneratorValue` implements `next`, `return`, and `throw` and runs via `evaluateAsync`.

## Gotchas

- Async generators cannot be invoked from `evaluate()` (sync mode).
- No prototype chain or `instanceof` behavior on async generator objects.
