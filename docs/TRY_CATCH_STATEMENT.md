# TryCatchStatement

## What it is

Error handling with `try { } catch { } finally { }`.

## Interpreter implementation

- Implemented in `evaluateTryStatement` / `evaluateTryStatementAsync`.
- Catch param must be an identifier.
- Finally can override control flow results.

## Gotchas

- Thrown values are wrapped as `InterpreterError` messages.
- Catch destructuring is not supported.
