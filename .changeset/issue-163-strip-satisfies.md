---
"nookjs": patch
---

Strip TypeScript `satisfies` expressions during parsing so modern TS code like
`const x = { a: 1 } satisfies { a: number }` preserves JavaScript runtime behavior instead of
failing on an undefined `satisfies` identifier.
