# ArrowFunctions

## What it is

Arrow functions like `x => x * 2`.

## Interpreter implementation

- Implemented in `evaluateArrowFunctionExpression`.
- Expression bodies are wrapped into an implicit `return`.
- Supports rest, default parameters, and destructuring.

## Gotchas

- No lexical `this` or `arguments` (behaves like normal functions).
- Arrow functions cannot be generators.
