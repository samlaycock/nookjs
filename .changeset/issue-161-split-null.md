---
"nookjs": patch
---

Align `String.prototype.split(null)` with native JavaScript semantics by coercing `null` to the
string `"null"` while continuing to treat `undefined` as an omitted separator.
