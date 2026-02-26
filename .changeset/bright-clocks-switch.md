---
"nookjs": patch
---

Return the correct `Program.sourceType` from the AST parser helpers: `parseScript()` now emits
`"script"` and `parseModule()` continues to emit `"module"`.
