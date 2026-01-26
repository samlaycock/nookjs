# CompoundAssignment

## What it is

Compound assignment operators that combine an operation with assignment: `+=`, `-=`, `*=`, `/=`, `%=`, `**=`, `<<=`, `>>=`, `>>>=`, `&=`, `|=`, `^=`.

## Interpreter implementation

- Evaluated by `evaluateCompoundAssignment` / `evaluateCompoundAssignmentAsync`.
- Reads the current value, applies the operation, and writes the result back.
- Supports identifiers, member expressions, and private fields as targets.

## Supported operators

- Arithmetic: `+=`, `-=`, `*=`, `/=`, `%=`, `**=`
- Bitwise: `&=`, `|=`, `^=`, `<<=`, `>>=`, `>>>=`

## Gotchas

- Assignment targets are subject to the same property and security checks as `=`.
- For logical assignment operators (`&&=`, `||=`, `??=`), see [LOGICAL_ASSIGNMENT](LOGICAL_ASSIGNMENT.md).
