# ArrowFunctions

## What it is

Arrow functions like `x => x * 2`.

## Interpreter implementation

- Implemented in `evaluateArrowFunctionExpression`.
- Expression bodies are wrapped into an implicit `return`.
- Supports rest and default parameters.

## Gotchas

- No lexical `this` or `arguments` (behaves like normal functions).
- No parameter destructuring.
- Arrow functions cannot be generators.
