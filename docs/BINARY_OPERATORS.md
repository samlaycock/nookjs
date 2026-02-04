# BinaryOperators

## What it is

Binary operations such as `+`, `-`, comparisons, bitwise operators, and `**`.

## Interpreter implementation

- Evaluated by `applyBinaryOperator`.
- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**`
- Comparison: `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`, `in`, `instanceof`
- Bitwise: `&`, `|`, `^`, `<<`, `>>`, `>>>`

## Supported Operators

| Category   | Operators                                                          | Example          |
| ---------- | ------------------------------------------------------------------ | ---------------- |
| Arithmetic | `+`, `-`, `*`, `/`, `%`, `**`                                      | `2 ** 3` → `8`   |
| Comparison | `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`, `in`, `instanceof` | `1 < 2` → `true` |
| Bitwise    | `&`, `\|`, `^`, `<<`, `>>`, `>>>`                                  | `5 << 1` → `10`  |

## Gotchas

- `in` requires the right-hand side to be an object.
- `instanceof` supports host constructors, `ClassValue`, and `FunctionValue` instances.
- Division/modulo by zero throws an `InterpreterError`.
- String concatenation with `+` coerces the other operand to a string.
- Exponentiation (`**`) has right-to-left associativity: `2 ** 3 ** 2` = `2 ** (3 ** 2)` = `512`.
