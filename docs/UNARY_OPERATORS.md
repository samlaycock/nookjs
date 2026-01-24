# UnaryOperators

## What it is

Unary operators like `+`, `-`, `!`, and `typeof`.

## Interpreter implementation

- `+`, `-`, `!` are handled in `applyUnaryOperator`.
- `typeof` is handled specially in `evaluateTypeof` to avoid undefined-variable errors.

## Gotchas

- `delete`, `void`, and bitwise `~` are not supported.
