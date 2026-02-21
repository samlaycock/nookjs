# CallExpression

## What it is

Function calls like `fn()` or `obj.method()`.

## Interpreter implementation

- Implemented in `evaluateCallExpression` / `evaluateCallExpressionAsync`.
- Member calls bind `this` to the object.
- Host functions use `HostFunctionValue` and return values are wrapped by `ReadOnlyProxy`.
- Optional chaining and `super()` are supported.

## Gotchas

- Spread arguments in calls accept iterables and iterators (arrays, strings, generators, Sets, etc.).
- Async host functions require `evaluateAsync`.
- `call`/`apply`/`bind` are blocked on host functions.
