# ReturnStatement

## What it is

Returns a value from a function.

## Interpreter implementation

- Implemented in `evaluateReturnStatement` / `evaluateReturnStatementAsync`.
- Uses a `ReturnValue` wrapper to bubble up through nested statements.

## Gotchas

- `return` outside a function is not meaningful and yields a wrapper value.
