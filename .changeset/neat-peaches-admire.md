---
"nookjs": patch
---

Throw an initialization error for cyclic ES module reads that access named exports before those bindings are initialized.
