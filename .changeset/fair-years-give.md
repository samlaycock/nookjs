---
"nookjs": patch
---

Add parser and interpreter support for ergonomic brand checks with private fields (`#field in obj`).

- Parse `PrivateIdentifier` as the left-hand side of `in` expressions while rejecting invalid uses like standalone `#field` expressions.
- Evaluate private-brand checks against the current class' private instance/static members in sync and async interpreter paths.
- Add regression coverage for AST parsing and runtime behavior of private `in` checks.
