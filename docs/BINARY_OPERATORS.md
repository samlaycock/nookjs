# BinaryOperators

## What it is

Binary operations such as `+`, `-`, comparisons, and bitwise operators.

## Interpreter implementation

- Evaluated by `applyBinaryOperator`.
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`, `in`, `instanceof`
- Bitwise: `&`, `|`, `^`, `<<`, `>>`, `>>>`
- Exponentiation (`**`) also requires the `ExponentiationOperator` feature.

## Supported Operators

| Category   | Operators                                                          | Example          |
| ---------- | ------------------------------------------------------------------ | ---------------- |
| Arithmetic | `+`, `-`, `*`, `/`, `%`                                            | `2 + 3` → `5`    |
| Comparison | `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`, `in`, `instanceof` | `1 < 2` → `true` |
| Bitwise    | `&`, `\|`, `^`, `<<`, `>>`, `>>>`                                  | `5 << 1` → `10`  |

## Gotchas

- `in` requires the right-hand side to be an object.
- `instanceof` supports host constructors, `ClassValue`, and `FunctionValue` instances.
- `FunctionValue` `instanceof` uses constructor metadata, not `Function.prototype` chain semantics.
- Division/modulo by zero defaults to `numericSemantics: "safe"` and throws an `InterpreterError`.
  Set `numericSemantics: "strict-js"` to use native JS results (`Infinity`, `-Infinity`, `NaN`).
- String concatenation with `+` coerces the other operand to a string.
- Exponentiation (`**`) is available when both `BinaryOperators` and `ExponentiationOperator` are enabled.
- Exponentiation has right-to-left associativity: `2 ** 3 ** 2` = `2 ** (3 ** 2)` = `512`.
