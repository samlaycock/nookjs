---
"nookjs": minor
---

Add support for dynamic `import()` expressions in async evaluation paths.

This introduces parser and interpreter support for `ImportExpression`, routes dynamic imports through the existing module resolver and cache logic, and enforces module authorization/depth limits consistently with static imports. It also updates ES2020+ preset feature flags and module documentation, plus adds regression tests for parsing, success paths, blocked imports, max depth, and caching behavior.
