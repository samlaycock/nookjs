# ForOfStatement

## What it is

Iterates over values of an iterable: `for (const x of iterable)`.

## Interpreter implementation

- Implemented in `evaluateForOfStatement` / `evaluateForOfStatementAsync`.
- Sync: arrays, generators, and objects with `Symbol.iterator`.
- Async: also supports `Symbol.asyncIterator` in `evaluateAsync`.

## Gotchas

- No `for await...of` syntax.
- Non-iterables throw.
