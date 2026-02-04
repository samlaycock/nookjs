# MemberExpression

## What it is

Property access like `obj.prop` or `obj[expr]`.

## Interpreter implementation

- Implemented in `evaluateMemberExpression` / `evaluateMemberExpressionAsync`.
- Dangerous properties are blocked via `validatePropertyName` and symbol checks.
- Prototype access is restricted in some paths (e.g., assignment and method extraction), but
  normal property access uses standard JS lookup after dangerous-name filtering.
- Array and string methods are provided by allowlists (`getArrayMethod`, `getStringMethod`),
  with native delegation for other safe methods.
- Generator methods (`next`, `return`, `throw`) are exposed via wrappers.
- Class static members and private fields are handled separately.

## Gotchas

- Many standard prototype methods are unavailable.
- Dangerous symbol keys are blocked; inherited symbol properties are blocked.
- Accessing dangerous or internal properties on host functions throws; safe static methods are allowed.
