# SequenceExpression

## What it is

The comma operator that evaluates multiple expressions and returns the last value: `(a, b, c)`.

## Interpreter implementation

- Parsed as `SequenceExpression` and handled in `evaluateSequenceExpression` / `evaluateSequenceExpressionAsync`.
- Each expression in the sequence is evaluated from left to right.
- The value of the last expression is returned.

## Gotchas

- All expressions are evaluated even if only the last value is returned.
- Side effects from earlier expressions still occur.
- Useful for writing multiple expressions where only one is allowed.

## Example

```javascript
// Returns 3
(1, 2, 3);

// Useful in for loop initializers
for (let i = 0, j = 10; i < j; i++, j--) {
  console.log(i, j);
}

// Shorthand for multiple statements in arrow function body
const fn = (console.log("init"), () => "result");
fn(); // Logs "init", returns "result"
```

## Availability

This feature is available in all presets. No additional feature flag is required.
