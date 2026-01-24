# StaticBlocks

## What it is

Static initialization blocks: `static { ... }`.

## Interpreter implementation

- Implemented in `executeStaticBlock` / `executeStaticBlockAsync`.
- Runs immediately after class definition in a class-specific environment.

## Gotchas

- No async static blocks.
- Exceptions propagate and abort class definition.
