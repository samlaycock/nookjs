# TaggedTemplateExpression

## What it is

Tagged template literals like `tag`hello ${world}``.

## Interpreter implementation

- Parsed as `TaggedTemplateExpression` and handled in `evaluateTaggedTemplateExpression` / `evaluateTaggedTemplateExpressionAsync`.
- The tag function is evaluated first, then called with the template as arguments.
- Template expressions are evaluated left to right.

## Gotchas

- The tag function receives the template strings as an array and the evaluated expressions as rest arguments.
- Raw strings are available via the `raw` property of template elements.
- The tag must be a callable (sandbox function, host function, or native function); class constructors are not callable without `new`.

## Example

```javascript
function tag(strings, ...values) {
  let result = "";
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      result += values[i].toUpperCase();
    }
  });
  return result;
}

const name = "world";
tag`hello ${name}`; // "hello WORLD"
```

## Availability

This feature is available in all presets that support template literals (ES2015+). No additional feature flag is required.
