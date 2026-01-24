# DoWhileStatement

## What it is

A `do { ... } while (condition)` loop that runs the body at least once.

## Interpreter implementation

- Implemented in `evaluateDoWhileStatement` / `evaluateDoWhileStatementAsync`.
- Generator execution uses dedicated do/while handlers.
- Loop control flow is handled by `handleLoopControlFlow`.

## Gotchas

- Body executes once before the test is checked.
- `break` exits the loop; `continue` skips to the test.
