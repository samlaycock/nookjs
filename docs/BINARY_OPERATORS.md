# BinaryOperators

## What it is

Binary operations such as `+`, `-`, comparisons, bitwise operators, and `**`.

## Interpreter implementation

- Evaluated by `applyBinaryOperator`.
- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**`
- Comparison: `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`
- Bitwise: `&`, `|`, `^`, `<<`, `>>`, `>>>`

## Gotchas

- No `in` or `instanceof` operators.
- Division/modulo by zero throws an `InterpreterError`.
