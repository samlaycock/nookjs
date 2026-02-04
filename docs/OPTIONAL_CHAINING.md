# OptionalChaining

## What it is

Optional chaining (`?.`) for safe member access and calls.

## Interpreter implementation

- Implemented via `ChainExpression` with an internal control-flow signal to short-circuit.
- If any optional access hits `null`/`undefined`, the chain returns `undefined`.

## Gotchas

- Optional chaining is only supported through `ChainExpression` nodes.
- Short-circuiting prevents further evaluation in the chain.
