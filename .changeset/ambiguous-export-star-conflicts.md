---
"nookjs": patch
---

Throw on ambiguous `export *` conflicts instead of silently using first-wins semantics. When two `export * from` statements in the same module each provide the same binding name from different ultimate sources, an `InterpreterError` is now thrown to match standard ESM behaviour. Diamond-shaped re-export graphs (where the same binding is reachable via multiple paths but originates from a single module) continue to work without error, as they are not ambiguous per the ESM specification.
