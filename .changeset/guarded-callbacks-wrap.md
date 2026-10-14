---
"nookjs": patch
---

Protect the arguments and `this` value host code passes to sandbox callbacks so callbacks cannot mutate host objects, arrays or errors, while preserving the identity of sandbox-owned values. Host functions passed back into host functions now receive the original host function.
