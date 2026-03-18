# ReturnStatement

## What it is

Returns a value from a function.

## Interpreter implementation

- Implemented in `evaluateReturnStatement` / `evaluateReturnStatementAsync`.
- Uses a `ControlFlowSignal` to bubble up through nested statements.

## Gotchas

- `return` outside a function throws `InterpreterError("Illegal return statement")`.
