---
"nookjs": patch
---

Avoid mutating host-owned iterator result objects when wrapping yielded values in `ReadOnlyProxy`.
`wrapIterator` now returns a new iterator result with a wrapped `value`, preventing failures for frozen
result objects and iterators that reuse result objects across calls.
