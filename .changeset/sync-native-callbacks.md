---
"nookjs": patch
---

Keep non-async sandbox callbacks synchronous when they are passed to native APIs that use callback return values during async evaluation. `'ab'.replace('a', () => 'x')`, `Array.from` mappers, `JSON.parse` revivers, `JSON.stringify` replacers, `Object.groupBy`/`Map.groupBy`, typed array comparators and `Map`/`Set` `forEach` now behave the same under `evaluateAsync()`/`run()` as under `evaluate()`, instead of receiving Promises.

Inside those callbacks, async host functions and async sandbox functions without `await` can still be called and return Promises, so `Promise.all(Array.from(xs, (x) => double(x)))` resolves correctly (including for multiple elements, which previously produced corrupted results).
