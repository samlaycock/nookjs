# DefaultParameters

## What it is

Default parameter values: `function f(x = 1) {}`.

## Interpreter implementation

- Implemented in `bindFunctionParameters` / `bindFunctionParametersAsync`.
- Defaults are evaluated when an argument is `undefined`.

## Gotchas

- Defaults apply to identifiers and destructuring patterns (requires `Destructuring`).
