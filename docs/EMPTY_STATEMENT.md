# EmptyStatement

## What it is

Empty statements that do nothing, represented by a single semicolon `;`.

## Interpreter implementation

- Parsed as `EmptyStatement` and handled directly in the statement executor.
- Returns `undefined` as the result value.
- Useful for creating no-op statements in the AST.

## Gotchas

- Empty statements are valid but have no effect.
- Often used in for loops when the body is handled elsewhere.
- Can be used in TypeScript type assertions to terminate a statement.

## Examples

```javascript
// Empty statement in for loop
for (let i = 0; i < 10; i++);

// Multiple empty statements
;;;

// TypeScript assertion followed by empty statement
value as Type;;
```

## Availability

This feature is available in all presets. No additional feature flag is required.
