---
"nookjs": patch
---

Strip ambient TypeScript `declare` declarations during parsing so strip-mode evaluation ignores
runtime-less declarations like `declare const foo: number;` instead of treating `declare` as an
undefined runtime identifier.
