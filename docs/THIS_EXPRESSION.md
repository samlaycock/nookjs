# ThisExpression

## What it is

Uses `this` inside functions and classes.

## Interpreter implementation

- Implemented in `evaluateThisExpression`.
- `this` value is stored on the current `Environment`.
- Derived class constructors enforce `super()` before `this` access.

## Gotchas

- Arrow functions do not capture lexical `this`.
