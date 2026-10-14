---
"nookjs": patch
---

Keep non-async sandbox callbacks synchronous when they are passed to native APIs that use callback return values during async evaluation. `'ab'.replace('a', () => 'x')`, `Array.from` mappers, `JSON.parse` revivers, `JSON.stringify` replacers, `Object.groupBy`/`Map.groupBy`, typed array comparators and `Map`/`Set` `forEach` now behave the same under `evaluateAsync()`/`run()` as under `evaluate()`, instead of receiving Promises.
