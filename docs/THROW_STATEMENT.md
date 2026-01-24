# ThrowStatement

## What it is

Throws an error with `throw expr`.

## Interpreter implementation

- Implemented in `evaluateThrowStatement` / `evaluateThrowStatementAsync`.
- Throws `InterpreterError` with message `Uncaught <value>`.

## Gotchas

- Thrown values do not propagate as raw values.
