# BinaryOperators

## What it is

Binary operations such as `+`, `-`, comparisons, and `**`.

## Interpreter implementation

- Evaluated by `applyBinaryOperator`.
- Supported: `+`, `-`, `*`, `/`, `%`, `**`, `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`.

## Gotchas

- No bitwise operators, `in`, or `instanceof`.
- Division/modulo by zero throws an `InterpreterError`.
