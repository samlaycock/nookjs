# ForInStatement

## What it is

Iterates over enumerable keys: `for (const k in obj)`.

## Interpreter implementation

- Implemented in `evaluateForInStatement` / `evaluateForInStatementAsync`.
- Uses `Object.keys` (own enumerable string keys only).

## Gotchas

- No inherited keys.
- Symbol keys are ignored.
- Left side must be an identifier or declaration (no destructuring).
