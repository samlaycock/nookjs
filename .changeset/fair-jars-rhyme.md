---
"nookjs": patch
---

Support iterable spread arguments in call expressions so call spread behavior matches native JavaScript more closely.

- Expand call spread arguments from generic iterables/iterators (including strings, Sets, Map iterators, and custom iterables), not just arrays.
- Keep sync and async argument evaluation paths aligned by using the same iterable validation logic.
- Preserve clear runtime errors for non-iterable spread values.
- Add regression coverage for iterable call spread success/failure cases and async call spread behavior.
- Update call/spread docs to reflect iterable support in call position.
