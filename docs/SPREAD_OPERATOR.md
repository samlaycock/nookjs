# SpreadOperator

## What it is

Spread syntax in arrays, objects, and call expressions.

## Interpreter implementation

- Array spread uses `validateArraySpread` and `iterableToArray`.
- Object spread requires a non-null, non-array object via `validateObjectSpread`.
- Call spread expands iterables and iterators.

## Gotchas

- Iterables are consumed eagerly into arrays.
- Object spread rejects arrays, null, and primitives.
