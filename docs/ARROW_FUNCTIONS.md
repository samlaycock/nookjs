# ArrowFunctions

## What it is

Arrow functions like `x => x * 2`.

## Interpreter implementation

- Implemented in `evaluateArrowFunctionExpression`.
- Expression bodies are wrapped into an implicit `return`.
- Supports rest, default parameters, and destructuring.
- Uses lexical `this` and lexical `arguments` from the enclosing scope.

## Gotchas

- Arrow functions cannot be generators.
