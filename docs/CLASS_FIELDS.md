# ClassFields

## What it is

Public instance and static fields on classes.

## Interpreter implementation

- Collected in `processClassBody` / `processClassBodyAsync`.
- Instance fields initialize on construction.
- Static fields initialize at class definition time.

## Gotchas

- Field initializers follow interpreter semantics and validations.
- Computed field names are coerced to strings; dangerous names are blocked.
