# NewExpression

## What it is

Constructor calls like `new Foo()`.

## Interpreter implementation

- Implemented in `evaluateNewExpression` / `evaluateNewExpressionAsync`.
- Supports `FunctionValue`, `HostFunctionValue`, and `ClassValue`.
- `FunctionValue` and `ClassValue` instances are plain objects (no native prototype chain).
- Host constructor returns are wrapped in `ReadOnlyProxy`.

## Gotchas

- No native prototype chain; `instanceof` uses interpreter metadata.
- Function constructors track only the constructor that created the default instance object. The
  interpreter does not model `Function.prototype` or custom prototype chains.
- If a constructor returns an object, it replaces the created instance.
