# SwitchStatement

## What it is

Multi-branch selection with `switch` / `case` / `default`.

## Interpreter implementation

- Implemented in `evaluateSwitchStatement` / `evaluateSwitchStatementAsync`.
- Uses strict equality for case matching.
- Fallthrough is supported.

## Gotchas

- `continue` inside a switch throws.
