# ExponentiationOperator

## What it is

The exponentiation operator `**` and exponentiation assignment `**=`.

## Interpreter implementation

- `**` is parsed as a binary expression and requires both `BinaryOperators` and `ExponentiationOperator`.
- `**=` is parsed as a compound assignment and requires `ExponentiationOperator`.
- The ES2016 and later ECMAScript presets enable this feature.

## Gotchas

- Exponentiation is right-associative: `2 ** 3 ** 2` evaluates as `2 ** (3 ** 2)`.
