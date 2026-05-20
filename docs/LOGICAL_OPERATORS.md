# LogicalOperators

## What it is

Logical operators `&&` and `||`.

## Interpreter implementation

- Implemented in `evaluateLogicalExpression` with short-circuit semantics.
- Nullish coalescing (`??`) also requires the `NullishCoalescing` feature.

## Gotchas

- Only `&&` and `||` are enabled by `LogicalOperators` alone.
- Nullish coalescing (`??`) is available when both `LogicalOperators` and `NullishCoalescing` are enabled.
