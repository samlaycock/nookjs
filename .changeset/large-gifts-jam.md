---
"nookjs": patch
---

Fix missing-name validation for named re-exports.

`export { missing } from "source.js"` now throws when the source module does not export the requested binding, matching named import validation behavior.
