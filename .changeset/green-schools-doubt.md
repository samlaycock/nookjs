---
"nookjs": patch
---

Fix callback-based array helpers so sparse arrays skip holes like native JavaScript for `map`, `filter`, `every`, `some`, `forEach`, `flatMap`, `reduce`, and `reduceRight`.
