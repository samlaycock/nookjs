# UpdateExpression

## What it is

Increment and decrement operators `++` and `--`.

## Interpreter implementation

- Implemented in `evaluateUpdateExpression`.
- Identifiers and member expressions are supported.

## Gotchas

- `obj.prop++` and `obj["prop"]++` are supported.
