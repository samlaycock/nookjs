# BreakStatement

## What it is

Exits loops or switch cases.

## Interpreter implementation

- Implemented in `evaluateBreakStatement`.
- Uses a `ControlFlowSignal` marker for control flow.

## Gotchas

- `break` outside a loop or `switch` throws `InterpreterError("Illegal break statement")`.
- Labeled breaks are fully supported. See [LABELED_STATEMENT.md](./LABELED_STATEMENT.md) for details.
