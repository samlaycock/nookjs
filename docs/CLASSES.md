# Classes

## What it is

ES6 class declarations and expressions.

## Interpreter implementation

- Implemented via `ClassValue` plus `buildClassValue` / `instantiateClass`.
- Methods are stored on class metadata (no JS prototype chain).
- `super` resolution walks the class chain explicitly.

## Gotchas

- No prototype or `instanceof` semantics.
- Class constructors cannot be called without `new`.
- Some standard class reflection is unavailable.
