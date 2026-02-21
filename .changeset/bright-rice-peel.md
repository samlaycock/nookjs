---
"nookjs": patch
---

Strip leading hashbang lines in parser entry points so common CLI scripts parse without pre-processing.

- Normalize `parseModule`, `parseScript`, and `parseModuleWithProfile` input by stripping a leading `#!...` line.
- Add regression tests for hashbang handling with LF and CRLF inputs.
- Keep non-leading `#!` invalid syntax to avoid broad tokenizer behavior changes.
- Update AST parser docs to describe supported hashbang stripping behavior.
