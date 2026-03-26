---
"nookjs": patch
---

Reject TypeScript `enum` and `namespace` declaration syntax during parsing so `parse()` and
`evaluate()` fail fast with a `ParseError` instead of degrading into confusing runtime identifier
errors.
