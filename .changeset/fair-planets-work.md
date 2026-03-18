---
"nookjs": patch
---

Honor `thisArg` for callback-based array helpers, including `map`, `filter`, `every`, `some`,
`forEach`, `find`, `findIndex`, `findLast`, `findLastIndex`, and `flatMap`, while preserving
lexical `this` for arrow callbacks.
