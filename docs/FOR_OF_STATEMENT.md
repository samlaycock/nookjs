# ForOfStatement

## What it is

Iterates over values of an iterable: `for (const x of iterable)`.

## Interpreter implementation

- Implemented in `evaluateForOfStatement` / `evaluateForOfStatementAsync`.
- Sync: arrays, generators, and objects with `Symbol.iterator`.
- Async: also supports `Symbol.asyncIterator` in `evaluateAsync`.
- Left side supports identifiers, declarations, and destructuring patterns.

## Gotchas

- `for await...of` is only supported in `evaluateAsync`.
- Non-iterables throw.
