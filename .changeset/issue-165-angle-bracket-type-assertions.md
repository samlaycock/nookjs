---
"nookjs": patch
---

Strip TypeScript angle-bracket assertions in non-TSX code so expressions like `const x = <number>1;`
parse and evaluate as `1`, matching the existing strip-mode handling for `as` assertions.
