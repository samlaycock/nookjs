# TemplateLiterals

## What it is

String templates like `` `hi ${name}` ``.

## Interpreter implementation

- Implemented in `evaluateTemplateLiteral` / `evaluateTemplateLiteralAsync`.
- Uses `buildTemplateLiteralString` and `coerceTemplateValue` for interpolation.

## Gotchas

- Coercion avoids user `toString` / `valueOf` hooks.
- Arrays are joined with commas, objects become `[object Object]`.
