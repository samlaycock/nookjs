# NewExpression

## What it is

Constructor calls like `new Foo()`.

## Interpreter implementation

- Implemented in `evaluateNewExpression` / `evaluateNewExpressionAsync`.
- Supports `FunctionValue`, `HostFunctionValue`, and `ClassValue`.
- Instances are plain objects (no prototype chain).
- Host constructor returns are wrapped in `ReadOnlyProxy`.

## Gotchas

- No prototype or `instanceof` semantics.
- If a constructor returns an object, it replaces the created instance.
