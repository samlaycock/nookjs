# LabeledStatement

## What it is

Labeled statements that can be referenced by `break` or `continue` in nested loops: `label: statement`.

## Interpreter implementation

- Parsed as `LabeledStatement` and handled in `evaluateLabeledStatement` / `evaluateLabeledStatementAsync`.
- Creates a label binding that can be targeted by break/continue.
- Supports labeled loops for breaking out of or continuing outer loops.

## Gotchas

- Labels can only be applied to loop statements (for, while, do-while, for-of, for-in).
- Label names must be unique within their scope.
- `break label` exits the labeled loop; `continue label` continues the labeled loop.

## Example

```javascript
outer: for (let i = 0; i < 3; i++) {
  inner: for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) {
      break outer; // Breaks out of both loops
    }
    console.log(i, j);
  }
}
// Output:
// 0 0
// 0 1
// 0 2
// 1 0
```

## Availability

This feature is available in all presets. No additional feature flag is required.
