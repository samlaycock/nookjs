# MemberExpression

## What it is

Property access like `obj.prop` or `obj[expr]`.

## Interpreter implementation

- Implemented in `evaluateMemberExpression` / `evaluateMemberExpressionAsync`.
- Dangerous properties are blocked via `validatePropertyName` and symbol checks.
- Inherited property access is blocked by `ensureNoPrototypeAccess`.
- Array and string methods are provided by allowlists (`getArrayMethod`, `getStringMethod`).
- Generator methods (`next`, `return`, `throw`) are exposed via wrappers.
- Class static members and private fields are handled separately.

## Gotchas

- Many standard prototype methods are unavailable.
- Dangerous symbol keys are blocked; inherited symbol properties are blocked.
- Accessing properties on host functions throws.
