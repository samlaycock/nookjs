# NullishCoalescing

## What it is

The nullish coalescing operator `??` and nullish coalescing assignment `??=`.

## Interpreter implementation

- `??` is parsed as a logical expression and requires both `LogicalOperators` and `NullishCoalescing`.
- `??=` is parsed as a logical assignment and requires both `LogicalAssignment` and `NullishCoalescing`.
- The ES2020 and later ECMAScript presets enable `??`.
- The ES2021 and later ECMAScript presets enable `??=` through `LogicalAssignment`.

## Gotchas

- `??` only falls back for `null` and `undefined`; other falsy values such as `0`, `false`, and `""` are returned unchanged.
