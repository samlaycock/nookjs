# PrivateFields

## What it is

Private fields and methods using `#name`.

## Interpreter implementation

- Stored per-class in `privateFieldStorage` using a `WeakMap`.
- Access enforced by `accessPrivateField` / `assignPrivateField`.

## Gotchas

- Only usable inside class bodies.
- No access via computed names or reflection.
