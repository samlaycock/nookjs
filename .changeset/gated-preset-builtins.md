---
"nookjs": patch
---

Gate standard built-in statics and prototype methods by ECMAScript preset so older presets no
longer leak newer host runtime APIs like `Array.from()`, `Object.groupBy()`, and
`Promise.withResolvers()`.
