---
"nookjs": patch
---

Decode `\xNN`, `\uNNNN`, and `\u{...}` escapes correctly in parser string literals and template quasis
so parsed/interpreted values match JavaScript behavior instead of returning placeholder cooked values.
