---
"nookjs": patch
---

Snapshot the initial length for `Array.prototype.find` and `Array.prototype.findIndex` so
callback-based iteration ignores elements appended during traversal, and add regression coverage
for mutation during `map`, `filter`, `forEach`, `find`, and `findIndex`.
