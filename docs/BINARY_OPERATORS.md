# BinaryOperators

## What it is

Binary operations such as `+`, `-`, comparisons, bitwise operators, and `**`.

## Interpreter implementation

- Evaluated by `applyBinaryOperator`.
- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**`
- Comparison: `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`
- Bitwise: `&`, `|`, `^`, `<<`, `>>`, `>>>`

## Supported Operators

| Category | Operators | Example |
|----------|-----------|---------|
| Arithmetic | `+`, `-`, `*`, `/`, `%`, `**` | `2 ** 3` → `8` |
| Comparison | `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=` | `1 < 2` → `true` |
| Bitwise | `&`, `\|`, `^`, `<<`, `>>`, `>>>` | `5 << 1` → `10` |

## Gotchas

- **`in` and `instanceof` operators are NOT supported** - These would require prototype chain access which is blocked for security.
- Division/modulo by zero throws an `InterpreterError`.
- String concatenation with `+` coerces the other operand to a string.
- Exponentiation (`**`) has right-to-left associativity: `2 ** 3 ** 2` = `2 ** (3 ** 2)` = `512`.
