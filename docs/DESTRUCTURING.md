# Destructuring

## What it is

Array and object destructuring assignments and declarations.

## Interpreter implementation

- Implemented in `destructureArrayPattern` / `destructureObjectPattern`.
- Supports rest elements and default values.
- Object destructuring supports computed keys.

## Gotchas

- Function parameter destructuring is supported (uses the same destructuring logic).
- Object rest only includes own enumerable properties.
- Dangerous property names are blocked.
