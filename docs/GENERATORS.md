# Generators

## What it is

Generator functions (`function*`) and generator objects that produce values via `yield`.

## Interpreter implementation

- Generator functions are represented by `FunctionValue` with `isGenerator = true`.
- Calling a generator function returns a `GeneratorValue` instance.
- Execution is managed by `GeneratorValue`, which implements `next`, `return`, and `throw`.
- Control flow in generator bodies is handled by generator-specific loop/try helpers.

## Gotchas

- No prototype chain or `instanceof` behavior on generator objects.
- Only iterator protocol methods are exposed (`next`, `return`, `throw`).
- Generator semantics follow interpreter behavior and feature checks.
